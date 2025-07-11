"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, BarChart3 } from "lucide-react"
import { DetailedLeaderboard } from "./detailed-leaderboard"
import { SimpleLeaderboard } from "./simple-leaderboard"

export function Leaderboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vista Detallada
          </TabsTrigger>
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Vista Simple
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="mt-6">
          <DetailedLeaderboard />
        </TabsContent>

        <TabsContent value="simple" className="mt-6">
          <SimpleLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
