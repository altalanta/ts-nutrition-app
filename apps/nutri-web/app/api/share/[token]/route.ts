import { NextRequest, NextResponse } from 'next/server'
import { createFilesystemShareService } from 'nutri-share'
import { hashIP } from 'nutri-share'

// Create share service at module level
let shareService: any = null

function getShareService() {
  if (!shareService) {
    shareService = createFilesystemShareService(
      process.env.SHARE_SECRET || 'development-secret',
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share`,
      parseInt(process.env.SHARE_TTL_SECONDS || '604800') // 7 days
    )
  }
  return shareService
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const { searchParams } = new URL(request.url)
  const download = searchParams.get('download') === '1'

  try {
    const service = getShareService()

    // Validate token
    const validation = service.validateToken(token)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 404 }
      )
    }

    const { id } = validation

    if (download) {
      // Download PDF
      const pdfBytes = await service.readPdf(id)
      if (!pdfBytes) {
        return NextResponse.json(
          { error: 'PDF not found' },
          { status: 404 }
        )
      }

      // Log access
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await service.logAccess({
        id,
        ts: new Date().toISOString(),
        ipHash: hashIP(ip, process.env.SHARE_SECRET || 'development-secret'),
        ua: userAgent,
      })

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="nutrition-report.pdf"`,
          'X-Share-Referrer': request.headers.get('referer') || '',
        },
      })
    } else {
      // Return metadata for prefetch
      const headInfo = await service.storage.head(id)
      if (!headInfo) {
        return NextResponse.json(
          { error: 'Share not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id,
        size: headInfo.size,
        meta: headInfo.meta,
      })
    }
  } catch (error) {
    console.error('Share access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





