import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { Plan, UserStatus } from "@/lib/enums";
import { sendPaymentEmail } from "@/lib/emailService";
import { createSubscription } from "@/lib/subscription";
import { Profile } from "@/models/Profile";
import { Persona } from "@/models/Persona";
import { HttpStatus } from "@/types/httpStatus";
import { log, LogLevel } from "@/lib/logger";
import { isAuthenticated } from "@/lib/auth0";
import { BillingAddressInput, normalizeTaxProfile } from "@/lib/tax-profile";

export type RegisterBody = {
  name: string;
  email: string;
  billingEmail: string;
  taxDocument: string;
  billingAddress: BillingAddressInput;
  plan: Plan;
  sub: string;
  picture: string;
};

export async function POST(req: Request) {
  try {
    const token = await isAuthenticated(req.headers);

    const body = await req.json();
    const {
      name,
      email,
      billingEmail,
      taxDocument,
      billingAddress,
      plan,
      picture,
      sub,
    }: RegisterBody = body;

    if (sub != token.sub) {
      await log(LogLevel.ERROR, "POST /register: Failed to authenticate the user", {
        email,
        plan,
        sub,
      });
      return NextResponse.json(
        { error: "Failed to authenticate the user" },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    if (!(
      name &&
      email &&
      billingEmail &&
      taxDocument &&
      billingAddress &&
      plan &&
      sub &&
      picture
    )) {
      await log(LogLevel.ERROR, "POST /register: Missing required registration fields", {
        email,
        plan,
      });
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const normalizedTaxProfile = normalizeTaxProfile({
      name,
      billingEmail,
      taxDocument,
      billingAddress,
    });

    if (normalizedTaxProfile.errors.length > 0 || !normalizedTaxProfile.data) {
      await log(LogLevel.WARN, "POST /register: Invalid tax profile data", {
        email,
        plan,
        invalidFields: normalizedTaxProfile.errors,
      });
      return NextResponse.json(
        { error: "Invalid tax profile data", fields: normalizedTaxProfile.errors },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await log(LogLevel.INFO, "POST /register: Registering user", { email, plan });

    await connectDB();

    const existing = await Profile.findOne({ email });
    if (existing) {
      await log(LogLevel.WARN, "POST /register: User already exists", { email });
      return NextResponse.json(null, { status: HttpStatus.CONFLICT });
    }

    if (!Object.values(Plan).includes(plan)) {
      await log(LogLevel.ERROR, "POST /register: Invalid plan selected", { email, plan });
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    await log(LogLevel.INFO, "Creating a new inactive user", { email, plan });

    const profile = await Profile.create({
      name: normalizedTaxProfile.data.name,
      email,
      billingEmail: normalizedTaxProfile.data.billingEmail,
      taxDocumentType: normalizedTaxProfile.data.taxDocumentType,
      taxDocument: normalizedTaxProfile.data.taxDocument,
      billingAddress: normalizedTaxProfile.data.billingAddress,
      billingProfileCompletedAt: normalizedTaxProfile.data.billingProfileCompletedAt,
      cpf: normalizedTaxProfile.data.legacy.cpf,
      cep: normalizedTaxProfile.data.legacy.cep,
      address: normalizedTaxProfile.data.legacy.address,
      address2: normalizedTaxProfile.data.legacy.address2,
      plan,
      picture,
      externalAuthId: sub,
      status: UserStatus.INACTIVE,
    });

    await log(LogLevel.INFO, "POST /register: Creating Stripe subscription", {
      email,
      plan,
      profileId: profile._id.toString(),
    });
    const subscription = await createSubscription({
      plan,
      email,
      profileId: profile._id.toString(),
      externalAuthId: sub,
      stripeCustomerId: profile.stripeCustomerId,
    });

    await Profile.findByIdAndUpdate(profile._id, {
      stripeCustomerId: subscription.stripeCustomerId,
      subscriptionId: subscription.stripeSubscriptionId || subscription.checkoutSessionId,
    });

    await Persona.create({ profile_id: profile._id });

    await sendPaymentEmail({
      name: normalizedTaxProfile.data.name,
      to: email,
      plan,
      paymentLink: subscription.checkoutUrl,
    });

    return NextResponse.json(null, { status: HttpStatus.CREATED });
  } catch (err: any) {
    await log(LogLevel.ERROR, "POST /register: Exception occurred", { error: err });
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
