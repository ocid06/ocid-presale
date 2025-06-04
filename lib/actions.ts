"use server"

import { supabaseAdmin } from "./supabase"

export interface PresaleStage {
  id: number
  stage_number: number
  price_per_token: number
  total_tokens: number
  sold_tokens: number
  start_date: string
  end_date: string
  is_active: boolean
}

export interface PresaleStats {
  totalRaised: number
  totalTokensSold: number
  currentStage: PresaleStage | null
}

export async function getPresaleData(): Promise<{
  stages: PresaleStage[]
  stats: PresaleStats
}> {
  try {
    // Get all stages
    const { data: stages, error: stagesError } = await supabaseAdmin
      .from("presale_stages")
      .select("*")
      .order("stage_number")

    if (stagesError) throw stagesError

    // Calculate total stats
    const totalTokensSold = stages?.reduce((sum, stage) => sum + Number(stage.sold_tokens), 0) || 0
    const totalRaised =
      stages?.reduce((sum, stage) => sum + Number(stage.sold_tokens) * Number(stage.price_per_token), 0) || 0

    // Find current active stage
    const currentStage = stages?.find((stage) => stage.is_active) || null

    return {
      stages: stages || [],
      stats: {
        totalRaised,
        totalTokensSold,
        currentStage,
      },
    }
  } catch (error) {
    console.error("Error fetching presale data:", error)
    return {
      stages: [],
      stats: {
        totalRaised: 0,
        totalTokensSold: 0,
        currentStage: null,
      },
    }
  }
}

export async function createPayment(
  walletAddress: string,
  tokenAmount: number,
  stageId: number,
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  try {
    // Get stage details
    const { data: stage, error: stageError } = await supabaseAdmin
      .from("presale_stages")
      .select("*")
      .eq("id", stageId)
      .single()

    if (stageError || !stage) {
      return { success: false, error: "Invalid stage" }
    }

    const paymentAmount = tokenAmount * Number(stage.price_per_token)

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("presale_transactions")
      .insert({
        user_wallet: walletAddress,
        stage_id: stageId,
        token_amount: tokenAmount,
        payment_amount: paymentAmount,
        payment_currency: "USD",
        status: "pending",
      })
      .select()
      .single()

    if (transactionError) {
      return { success: false, error: "Failed to create transaction" }
    }

    // Create NowPayments payment
    const nowPaymentsResponse = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: paymentAmount,
        price_currency: "USD",
        pay_currency: "btc",
        order_id: transaction.id.toString(),
        order_description: `OCID Token Purchase - ${tokenAmount} OCD tokens`,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-callback`,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/presale`,
      }),
    })

    const paymentData = await nowPaymentsResponse.json()

    if (!nowPaymentsResponse.ok) {
      return { success: false, error: "Payment creation failed" }
    }

    // Update transaction with payment ID
    await supabaseAdmin
      .from("presale_transactions")
      .update({ payment_id: paymentData.payment_id })
      .eq("id", transaction.id)

    return {
      success: true,
      paymentUrl: paymentData.invoice_url,
    }
  } catch (error) {
    console.error("Payment creation error:", error)
    return { success: false, error: "Internal server error" }
  }
}
