import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { ClothingItem } from '../types/clothing'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

interface UseImageProcessingStatusOptions {
  itemIds: string[]
  onStatusUpdate?: (items: ClothingItem[]) => void
  enabled?: boolean
  pollingInterval?: number
}

interface ProcessingStatusResponse {
  items: ClothingItem[]
}

export const useImageProcessingStatus = ({
  itemIds,
  onStatusUpdate,
  enabled = true,
  pollingInterval = 2000 // Poll every 2 seconds
}: UseImageProcessingStatusOptions) => {
  const [processingItems, setProcessingItems] = useState<ClothingItem[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async () => {
    if (itemIds.length === 0) return

    try {
      const response = await axios.get<ProcessingStatusResponse>(
        `${API_BASE}/api/images/processing-status`,
        {
          params: { ids: itemIds.join(',') },
          withCredentials: true
        }
      )

      const items = response.data.items
      setProcessingItems(items)

      // Notify parent component of updates
      if (onStatusUpdate) {
        onStatusUpdate(items)
      }

      // Check if all items are done processing
      const allDone = items.every(
        item => item.processingStatus === 'completed' || item.processingStatus === 'failed'
      )

      if (allDone) {
        stopPolling()
      }
    } catch (error) {
      console.error('Error fetching processing status:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds, onStatusUpdate])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return // Already polling

    setIsPolling(true)

    // Fetch immediately
    fetchStatus()

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      fetchStatus()
    }, pollingInterval)
  }, [fetchStatus, pollingInterval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Start/stop polling based on enabled flag and itemIds
  useEffect(() => {
    if (enabled && itemIds.length > 0) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, itemIds.length, startPolling, stopPolling])

  return {
    processingItems,
    isPolling,
    startPolling,
    stopPolling,
    refetch: fetchStatus
  }
}
