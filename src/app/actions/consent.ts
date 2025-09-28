"use server";

import { connectDB } from "@/lib/db"
import { auth0 } from "@/lib/auth0"
import { log, LogLevel } from "@/lib/logger"
import { Consent, ConsentEventStatus } from "@/models/Consent";
import { ITerm, Term } from "@/models/Term";


export async function toggleConsent(email: string, checked: boolean) {
  
  try {
    const session = await auth0.getSession()
    if (!session) {
      await log(LogLevel.ERROR, "toggleConsent: User authentication failed", { email })
      throw new Error("User authentication failed")
    }
  
    await connectDB()
    
    await log(LogLevel.INFO, "Updating consent status", { email, checked })
    const term = (await Term.findOne({}, {}, { sort: { createdAt: -1 } })) as ITerm
    const consent = await Consent.findOne({ email })
  
    if (!consent) {
      await Consent.create({
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentVersion: term.version,
        status: checked ? ConsentEventStatus.AGREED : ConsentEventStatus.DISAGREED,
        events: [
          {
            createdAt: new Date(),
            status: checked ? ConsentEventStatus.AGREED : ConsentEventStatus.DISAGREED,
          }
        ]
      })
  
      return true
    }
    
    await Consent.findOneAndUpdate(
      { email },
      {
        $set: {
          currentVersion: term.version,
          updatedAt: new Date(),
          status: checked ? ConsentEventStatus.AGREED : ConsentEventStatus.DISAGREED,
        },
        $push: {
          events: {
            createdAt: new Date(),
            status: checked ? ConsentEventStatus.AGREED : ConsentEventStatus.DISAGREED,
          }
        }
      }
    )

    return true
    
  } catch (err) {
    await log(LogLevel.ERROR, "toggleConsent: Updating consent status", { email, checked })
    return false
  }
}