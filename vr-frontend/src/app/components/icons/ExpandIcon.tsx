interface ExpandIconProps {
  size?: number
  className?: string
}

export function ExpandIcon({ size = 24, className = "" }: ExpandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10.5 25.5791H3.55273C1.59069 25.5791 2.78034e-05 23.9884 0 22.0264V3.55273C0 1.59067 1.59067 0 3.55273 0H10.5V25.5791ZM26.4473 0C28.4093 0 30 1.59067 30 3.55273V22.0264C30 23.9884 28.4093 25.5791 26.4473 25.5791H19.5V0H26.4473ZM15 11.1904C15.7847 11.1904 16.4207 11.9063 16.4209 12.7891C16.4209 13.672 15.7848 14.3877 15 14.3877C14.2152 14.3877 13.5791 13.672 13.5791 12.7891C13.5793 11.9063 14.2153 11.1904 15 11.1904Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
