import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, payment_status, order_id } = body

    // Verify the callback is from NowPayments (you should implement proper verification)
    const apiKey = request.headers.get("x-nowpayments-sig")

    if (payment_status === "finished") {
      // Update transaction status
      const { error: updateError } = await supabaseAdmin
        .from("presale_transactions")
        .update({ status: "completed" })
        .eq("id", Number.parseInt(order_id))
        .eq("payment_id", payment_id)

      if (!updateError) {
        // Update sold tokens in stage
        const { data: transaction } = await supabaseAdmin
          .from("presale_transactions")
          .select("token_amount, stage_id")
          .eq("id", Number.parseInt(order_id))
          .single()

        if (transaction) {
          await supabaseAdmin.rpc("increment_sold_tokens", {
            stage_id: transaction.stage_id,
            amount: transaction.token_amount,
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
