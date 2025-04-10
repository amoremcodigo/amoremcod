import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Capturar todos os cabeçalhos
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Capturar o corpo da requisição
    const body = await request.json().catch(() => ({}))

    // Verificar o token específico
    const token = request.headers.get("x-kirvano-token")
    const expectedToken = process.env.KIRVANO_WEBHOOK_TOKEN

    // Informações de diagnóstico
    const diagnosticInfo = {
      receivedToken: token,
      expectedTokenFirstChars: expectedToken ? `${expectedToken.substring(0, 3)}...` : null,
      expectedTokenLength: expectedToken ? expectedToken.length : 0,
      tokenMatch: token === expectedToken,
      allHeaders: headers,
      body: body,
      envVars: {
        hasKirvanoToken: !!process.env.KIRVANO_WEBHOOK_TOKEN,
      },
    }

    return NextResponse.json({
      message: "Informações de diagnóstico do webhook",
      diagnosticInfo,
    })
  } catch (error) {
    console.error("Erro ao processar webhook de diagnóstico:", error)
    return NextResponse.json(
      {
        error: "Erro interno",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
