#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const
    t = resolve('./Kartverket.Web/map-ui/'),
    c = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ai = ['-C', t, 'install'],
    ad = ['run', 'dev'];

const install = spawn(c, ai, { stdio: 'inherit' });

install.on('close', code => {
    if (code !== 0) {
        console.error(`pnpm install process exited with code ${code}`);
        process.exit(code);
    }

    const dev = spawn(c, ad, { stdio: 'inherit', cwd: t });

    dev.on('close', code => {
        if (code !== 0) {
            console.error(`pnpm dev process exited with code ${code}`);
            process.exit(code);
        }
    });
});