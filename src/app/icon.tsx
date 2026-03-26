import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Mic capsule body */}
          <div
            style={{
              width: 9,
              height: 13,
              background: 'white',
              borderRadius: 5,
            }}
          />
          {/* Stand arm — U-shape: border on sides + bottom, no top */}
          <div
            style={{
              width: 15,
              height: 6,
              borderLeft: '2px solid white',
              borderRight: '2px solid white',
              borderBottom: '2px solid white',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              marginTop: -1,
            }}
          />
          {/* Vertical stem */}
          <div
            style={{
              width: 2,
              height: 3,
              background: 'white',
            }}
          />
          {/* Horizontal base */}
          <div
            style={{
              width: 9,
              height: 2,
              background: 'white',
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
