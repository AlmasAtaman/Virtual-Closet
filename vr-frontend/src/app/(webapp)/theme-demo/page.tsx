"use client"

import { ThemeToggle } from "../../components/ThemeToggle"
import { useTheme } from "../../contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Sun, Moon, Chrome } from "lucide-react"

export default function ThemeDemoPage() {
  const { resolvedTheme } = useTheme()

  const themeDescriptions = {
    light: {
      name: "Light Theme",
      description: "Clean and bright - perfect for showcasing fashion items with maximum clarity",
      icon: <Sun className="w-5 h-5" />,
      color: "text-yellow-600"
    },
    dark: {
      name: "Dark Theme", 
      description: "Pure black aesthetic - minimal and sleek for focused fashion curation",
      icon: <Moon className="w-5 h-5" />,
      color: "text-purple-400"
    },
    chrome: {
      name: "Chrome Theme",
      description: "Dark blue professional - sophisticated chrome-like appearance for premium feel",
      icon: <Chrome className="w-5 h-5" />,
      color: "text-blue-400"
    }
  }

  const currentTheme = themeDescriptions[resolvedTheme] || themeDescriptions.light

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">VrC Theme System</h1>
            <p className="text-muted-foreground">Professional 3-way theming for fashion applications</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Current Theme Info */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={currentTheme.color}>{currentTheme.icon}</span>
              Currently Using: {currentTheme.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{currentTheme.description}</p>
          </CardContent>
        </Card>

        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(themeDescriptions).map(([key, theme]) => (
            <Card key={key} className={resolvedTheme === key ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={theme.color}>{theme.icon}</span>
                  {theme.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{theme.description}</p>
                {resolvedTheme === key && (
                  <Badge variant="default" className="text-xs">Current Theme</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fashion Item Demos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square bg-white dark:bg-slate-800 chrome:bg-slate-700 rounded-lg flex items-center justify-center mb-4 clothing-image">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 chrome:from-slate-600 chrome:to-blue-700 rounded-lg flex items-center justify-center text-2xl">
                  👕
                </div>
              </div>
              <h3 className="font-medium mb-2">T-Shirt</h3>
              <div className="flex gap-1 mb-2">
                <Badge variant="secondary" className="text-xs">Casual</Badge>
                <Badge variant="secondary" className="text-xs">Cotton</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">$29.99</span>
                <button className="p-1 rounded-full bg-white/80 dark:bg-slate-800/80 chrome:bg-slate-700/80 backdrop-blur-sm">
                  <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400 chrome:text-gray-300" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="aspect-square bg-white dark:bg-slate-800 chrome:bg-slate-700 rounded-lg flex items-center justify-center mb-4 clothing-image">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 chrome:from-slate-600 chrome:to-emerald-700 rounded-lg flex items-center justify-center text-2xl">
                  👖
                </div>
              </div>
              <h3 className="font-medium mb-2">Jeans</h3>
              <div className="flex gap-1 mb-2">
                <Badge variant="secondary" className="text-xs">Casual</Badge>
                <Badge variant="secondary" className="text-xs">Denim</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">$79.99</span>
                <button className="p-1 rounded-full bg-white/80 dark:bg-slate-800/80 chrome:bg-slate-700/80 backdrop-blur-sm">
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="aspect-square bg-white dark:bg-slate-800 chrome:bg-slate-700 rounded-lg flex items-center justify-center mb-4 clothing-image">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 chrome:from-slate-600 chrome:to-purple-700 rounded-lg flex items-center justify-center text-2xl">
                  👔
                </div>
              </div>
              <h3 className="font-medium mb-2">Dress Shirt</h3>
              <div className="flex gap-1 mb-2">
                <Badge variant="secondary" className="text-xs">Formal</Badge>
                <Badge variant="secondary" className="text-xs">Cotton</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">$59.99</span>
                <button className="p-1 rounded-full bg-white/80 dark:bg-slate-800/80 chrome:bg-slate-700/80 backdrop-blur-sm">
                  <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400 chrome:text-gray-300" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Buttons</h4>
              <div className="flex gap-2 flex-wrap">
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Delete Button</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Favorites Toggle</h4>
              <button className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 chrome:bg-slate-600 transition-colors">
                <Heart className="stroke-black dark:stroke-white chrome:stroke-slate-200" />
              </button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Color Palette</h4>
              <div className="grid grid-cols-8 gap-2">
                <div className="h-8 bg-background rounded border"></div>
                <div className="h-8 bg-foreground rounded"></div>
                <div className="h-8 bg-primary rounded"></div>
                <div className="h-8 bg-secondary rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-8 bg-accent rounded"></div>
                <div className="h-8 bg-card rounded border"></div>
                <div className="h-8 bg-border rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to App
          </Button>
        </div>
      </div>
    </div>
  )
}