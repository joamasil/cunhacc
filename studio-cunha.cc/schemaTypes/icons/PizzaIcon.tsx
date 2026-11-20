/** A pizza slice, drawn to match @sanity/icons (25×25 viewBox, 1.2 stroke, currentColor). */
export function PizzaIcon() {
  return (
    <svg
      data-sanity-icon="pizza"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="rotate(45 12.5 12.5)">
        {/* crust */}
        <path
          d="M5 7.5C9.5 4.5 15.5 4.5 20 7.5"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* slice */}
        <path
          d="M5.5 8.5L12.5 20.5L19.5 8.5"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* pepperoni */}
        <circle cx={10.5} cy={10.5} r={1.25} stroke="currentColor" strokeWidth={1.2} />
        <circle cx={14.75} cy={11} r={1.25} stroke="currentColor" strokeWidth={1.2} />
        <circle cx={12.5} cy={15.5} r={1.25} stroke="currentColor" strokeWidth={1.2} />
      </g>
    </svg>
  )
}
