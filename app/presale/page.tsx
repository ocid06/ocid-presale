"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Coins, Clock, TrendingUp, Wallet } from "lucide-react"
import { getPresaleData, createPayment, type PresaleStage, type PresaleStats } from "@/lib/actions"

export default function PresalePage() {
  const [stages, setStages] = useState<PresaleStage[]>([])
  const [stats, setStats] = useState<PresaleStats>({
    totalRaised: 0,
    totalTokensSold: 0,
    currentStage: null,
  })
  const [walletAddress, setWalletAddress] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    loadPresaleData()
    const interval = setInterval(loadPresaleData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadPresaleData = async () => {
    try {
      const data = await getPresaleData()
      setStages(data.stages)
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to load presale data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!walletAddress || !tokenAmount || !stats.currentStage) return

    setIsPurchasing(true)
    try {
      const result = await createPayment(walletAddress, Number.parseInt(tokenAmount), stats.currentStage.id)

      if (result.success && result.paymentUrl) {
        window.open(result.paymentUrl, "_blank")
      } else {
        alert(result.error || "Payment creation failed")
      }
    } catch (error) {
      console.error("Purchase error:", error)
      alert("Purchase failed. Please try again.")
    } finally {
      setIsPurchasing(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    const diff = end - now

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return `${days}d ${hours}h remaining`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading presale data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">OCID Token Presale</h1>
          <p className="text-xl text-blue-200 mb-2">Symbol: OCD</p>
          <p className="text-lg text-gray-300">Join the future of decentralized innovation</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-12 w-12 text-green-400" />
                <div>
                  <p className="text-sm text-gray-300">Total Raised</p>
                  <p className="text-2xl font-bold text-white">${formatNumber(stats.totalRaised)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Coins className="h-12 w-12 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-300">Tokens Sold</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(stats.totalTokensSold)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Clock className="h-12 w-12 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-300">Current Stage</p>
                  <p className="text-2xl font-bold text-white">Stage {stats.currentStage?.stage_number ?? "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Presale Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stages.map((stage) => {
            const progress = (Number(stage.sold_tokens) / Number(stage.total_tokens)) * 100
            const isActive = stage.is_active
            const isCompleted = progress >= 100

            return (
              <Card
                key={stage.id}
                className={`${
                  isActive
                    ? "bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/50"
                    : "bg-white/10 backdrop-blur-sm border-white/20"
                } transition-all duration-300`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Stage {stage.stage_number}</CardTitle>
                    {isActive && <Badge className="bg-green-500 text-white">Active</Badge>}
                    {isCompleted && <Badge className="bg-gray-500 text-white">Completed</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-300">Price per token</p>
                    <p className="text-xl font-bold text-white">${Number(stage.price_per_token).toFixed(4)}</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-300">
                      {formatNumber(Number(stage.sold_tokens))} / {formatNumber(Number(stage.total_tokens))} tokens
                    </p>
                  </div>

                  {isActive && (
                    <div className="text-sm text-green-400">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {getTimeRemaining(stage.end_date)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Purchase Section */}
        {stats.currentStage && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-center">
                <Wallet className="inline h-6 w-6 mr-2" />
                Buy OCD Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wallet" className="text-gray-300">
                  Wallet Address
                </Label>
                <Input
                  id="wallet"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-gray-300">
                  Token Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter token amount"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              {tokenAmount && (
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm text-gray-300">Total Cost:</p>
                  <p className="text-xl font-bold text-white">
                    ${(Number.parseInt(tokenAmount || "0") * Number(stats.currentStage.price_per_token)).toFixed(4)}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePurchase}
                disabled={!walletAddress || !tokenAmount || isPurchasing}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isPurchasing ? "Processing..." : "Buy Tokens"}
              </Button>

              <p className="text-xs text-gray-400 text-center">Payment processed securely via NowPayments</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
