import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection, SmtpConfigOverride } from '@/lib/email';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { testEmail, config, saveToEnv } = body as {
      testEmail?: string;
      config?: SmtpConfigOverride;
      saveToEnv?: boolean;
    };

    const result = await testSmtpConnection(testEmail, config);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // If successfully verified and requested to save to .env.local
    if (saveToEnv && config?.user && config?.pass) {
      try {
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf-8');
        }

        const updateOrAdd = (key: string, val: string) => {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        };

        if (config.host) updateOrAdd('SMTP_HOST', config.host);
        if (config.port) updateOrAdd('SMTP_PORT', String(config.port));
        if (config.user) updateOrAdd('SMTP_USER', config.user);
        if (config.pass) updateOrAdd('SMTP_PASS', config.pass);
        if (config.from) updateOrAdd('SMTP_FROM', config.from);

        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
      } catch (saveErr) {
        console.warn('[SMTP Save Warning]', saveErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

