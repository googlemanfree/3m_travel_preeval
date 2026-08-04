import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { profileEvaluations } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

export const profileEvaluationRouter = router({
  /**
   * Soumettre une évaluation de profil complète
   */
  submit: publicProcedure
    .input(
      z.object({
        destination: z.string(),
        projectType: z.enum(["student", "visitor", "worker", "permanent_residence", "family_reunification", "other"]),
        currentCountry: z.string().optional(),
        communicationLanguage: z.enum(["fr", "en"]).default("fr"),
        
        // Informations personnelles
        fullName: z.string(),
        gender: z.enum(["homme", "femme", "autre"]).optional(),
        dateOfBirth: z.string().optional(),
        placeOfBirth: z.string().optional(),
        nationality: z.string().optional(),
        currentAddress: z.string().optional(),
        whatsappPhone: z.string(),
        email: z.string().email(),
        
        // Passeport
        passportNumber: z.string().optional(),
        passportCountry: z.string().optional(),
        passportIssueDate: z.string().optional(),
        passportExpiryDate: z.string().optional(),
        passportCopyAvailable: z.boolean().default(false),
        oldPassportAvailable: z.boolean().default(false),
        idCardAvailable: z.boolean().default(false),
        
        // Famille
        maritalStatus: z.enum(["celibataire", "marie", "divorce", "veuf", "union_libre"]).optional(),
        spouseName: z.string().optional(),
        numberOfChildren: z.number().default(0),
        dependents: z.number().default(0),
        familyInDestination: z.boolean().default(false),
        familyMemberRelation: z.string().optional(),
        familyMemberStatus: z.string().optional(),
        
        // Études
        educationLevel: z.string().optional(),
        latestDiploma: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        diplomaYear: z.number().optional(),
        institution: z.string().optional(),
        diplomasAvailable: z.boolean().default(false),
        
        // Emploi
        currentProfession: z.string().optional(),
        currentEmployer: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        previousExperiences: z.string().optional(), // JSON
        monthlyIncome: z.number().optional(),
        cvAvailable: z.boolean().default(false),
        jobOfferAvailable: z.boolean().default(false),
        
        // Finances
        bankBalance: z.number().optional(),
        bankBalanceAverage6Months: z.number().optional(),
        hasSponsor: z.boolean().default(false),
        sponsorName: z.string().optional(),
        fundSource: z.string().optional(),
        realEstate: z.boolean().default(false),
        businessActivity: z.boolean().default(false),
        debts: z.boolean().default(false),
        
        // Voyage
        countriesVisited: z.string().optional(), // JSON
        visasObtained: z.string().optional(), // JSON
        visaRefusals: z.boolean().default(false),
        overstayHistory: z.boolean().default(false),
        deportationOrRefusal: z.boolean().default(false),
        previousApplications: z.string().optional(), // JSON
        
        // Admissibilité
        criminalRecord: z.boolean().default(false),
        immigrationIssues: z.boolean().default(false),
        medicalConcerns: z.boolean().default(false),
        falseDeclaration: z.boolean().default(false),
        specialNeeds: z.string().optional(),
        
        // Documents
        documentsAvailable: z.string().optional(), // JSON
        
        // Conditionnel: Étudiant
        desiredProgram: z.string().optional(),
        desiredEducationLevel: z.string().optional(),
        targetInstitution: z.string().optional(),
        admissionLetterAvailable: z.boolean().default(false),
        intendedStartDate: z.string().optional(),
        studyBudget: z.number().optional(),
        studyFunder: z.string().optional(),
        academicProject: z.string().optional(),
        postStudiesProject: z.string().optional(),
        companions: z.string().optional(), // JSON
        
        // Conditionnel: Visiteur
        visitReason: z.string().optional(),
        visitType: z.enum(["tourism", "family", "business", "event", "other"]).optional(),
        plannedStayDuration: z.string().optional(),
        estimatedTravelDate: z.string().optional(),
        plannedAccommodation: z.string().optional(),
        invitingPerson: z.string().optional(),
        invitationLetterAvailable: z.boolean().default(false),
        stayFunder: z.string().optional(),
        tiesInHomeCountry: z.string().optional(), // JSON
        
        // Conditionnel: Travailleur
        desiredPosition: z.string().optional(),
        targetCity: z.string().optional(),
        relatedExperience: z.number().optional(),
        relatedDiplomas: z.string().optional(), // JSON
        languageLevel: z.string().optional(),
        departureAvailability: z.string().optional(),
        
        // Conditionnel: Résidence permanente
        targetCategory: z.string().optional(),
        age: z.number().optional(),
        ecaAvailable: z.boolean().default(false),
        experienceYears: z.number().optional(),
        experienceInDestination: z.boolean().default(false),
        provincialNomination: z.boolean().default(false),
        availableFunds: z.number().optional(),
        policeCertificatesAvailable: z.boolean().default(false),
        
        submissionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(profileEvaluations).values({
        ...input,
        status: "submitted",
      });
      
      return {
        success: true,
        message: "Votre évaluation de profil a été soumise avec succès. Notre équipe vous contactera sous 24h.",
      };
    }),

  /**
   * Récupérer une évaluation par ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const evaluation = await db
        .select()
        .from(profileEvaluations)
        .where(eq(profileEvaluations.id, input.id))
        .limit(1);
      
      return evaluation[0] || null;
    }),
});
