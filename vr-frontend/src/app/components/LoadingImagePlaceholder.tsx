import React from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface LoadingImagePlaceholderProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  onRetry?: () => void
  className?: string
}

export const LoadingImagePlaceholder: React.FC<LoadingImagePlaceholderProps> = ({
  status,
  error,
  onRetry,
  className = ''
}) => {
  if (status === 'completed') {
    return null // Image should be shown instead
  }

  if (status === 'failed') {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ minHeight: '200px' }}
      >
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 mb-2 text-center px-4">
          Processing failed
        </p>
        {error && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center px-4">
            {error}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Processing
          </button>
        )}
      </div>
    )
  }

  // status === 'pending' | 'processing'
  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg ${className}`}
      style={{ minHeight: '200px' }}
    >
      <div className="relative">
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse"></div>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
        {status === 'pending' ? 'Queued for processing...' : 'Processing image...'}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Removing background and optimizing
      </p>
    </div>
  )
}

// Alternative compact version for smaller displays with skeleton/shimmer loader
export const CompactLoadingPlaceholder: React.FC<{ status: 'pending' | 'processing' | 'failed' }> = ({ status }) => {
  if (status === 'failed') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
    )
  }

  // Skeleton/shimmer loader - no blurred image background
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent"></div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-600 animate-spin mx-auto" />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {status === 'pending' ? 'Processing...' : 'Processing...'}
          </p>
        </div>
      </div>
    </div>
  )
}
