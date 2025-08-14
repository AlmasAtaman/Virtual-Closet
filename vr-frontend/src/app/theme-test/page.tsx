"use client"

import { ThemeToggle } from "../components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">3-Way Theme Test</h1>
          <ThemeToggle />
        </div>

        {/* Cards demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fashion Item Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-white dark:bg-slate-800 chrome:bg-slate-700 rounded-lg flex items-center justify-center mb-4 clothing-image">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 chrome:from-slate-600 chrome:to-blue-700 rounded-lg flex items-center justify-center">
                  👕
                </div>
              </div>
              <h3 className="font-medium mb-2">Sample T-Shirt</h3>
              <div className="flex gap-2 mb-2">
                <Badge variant="secondary">Casual</Badge>
                <Badge variant="secondary">Cotton</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                This demonstrates how clothing items look in Light, Dark, and Chrome themes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Colors</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-8 bg-primary rounded"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                  <div className="h-8 bg-accent rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Buttons</h4>
                <div className="space-x-2">
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Text Colors</h4>
                <p className="text-foreground">Primary text</p>
                <p className="text-muted-foreground">Muted text</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation back */}
        <div className="text-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to App
          </Button>
        </div>
      </div>
    </div>
  )
}