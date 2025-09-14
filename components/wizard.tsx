"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"

interface WizardStep {
  title: string
  description?: string
  content: React.ReactNode
}

interface WizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onNext?: () => void
  onPrevious?: () => void
  onFinish?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLoading?: boolean
  className?: string
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onFinish,
  canGoNext = true,
  canGoPrevious = true,
  isLoading = false,
  className,
}: WizardProps) {
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className={cn("space-y-8", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isClickable = index <= currentStep

            return (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => isClickable && onStepChange(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium transition-all duration-200",
                    isActive && "border-indigo-500 bg-indigo-500 text-white shadow-lg scale-110",
                    isCompleted && "border-green-500 bg-green-500 text-white",
                    !isActive && !isCompleted && "border-gray-300 bg-white text-gray-500 hover:border-gray-400",
                    isClickable && "cursor-pointer",
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2 transition-colors duration-200",
                      index < currentStep ? "bg-green-500" : "bg-gray-300",
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            {steps[currentStep].description && <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>}
          </div>
          <div className="min-h-[400px]">{steps[currentStep].content}</div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious || currentStep === 0 || isLoading}
          className="rounded-xl bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Sebelumnya
        </Button>

        <div className="text-sm text-gray-500">
          Langkah {currentStep + 1} dari {steps.length}
        </div>

        {isLastStep ? (
          <Button
            onClick={onFinish}
            disabled={!canGoNext || isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            {isLoading ? "Memproses..." : "Selesai"}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
