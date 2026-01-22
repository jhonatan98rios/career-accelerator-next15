"use server";

import { NuvemFiscalBody } from "./nuvemFiscal.d";

type AuthResponse = {
    "access_token": string,
    "token_type": string,
    "scope": string,
    "expires_in": number
}

export async function getNuvemFiscalToken(): Promise<AuthResponse> {
    const clientId = process.env.NUVEMFISCAL_CLIENT_ID;
    const clientSecret = process.env.NUVEMFISCAL_CLIENT_SECRET;
    const res = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'auth.nuvemfiscal.com.br'
        },
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': clientId!,
            'client_secret': clientSecret!,
            'scope': 'nfse'
        }).toString()
    });
    return res.json();
}

export async function generateNuvemFiscalInvoice(jwtToken: string, invoiceData: NuvemFiscalBody) {
    const res = await fetch('https://api.nuvemfiscal.com.br/v2/nfse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(invoiceData)
    });
    return res.json();
}
