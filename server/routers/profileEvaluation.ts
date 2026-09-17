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
        destination: z.string().max(100),
        projectType: z.enum(["student", "visitor", "worker", "permanent_residence", "family_reunification", "other"]),
        currentCountry: z.string().max(100).optional(),
        communicationLanguage: z.enum(["fr", "en"]).default("fr"),
        
        // Informations personnelles
        fullName: z.string().min(2).max(255),
        gender: z.enum(["homme", "femme", "autre"]).optional(),
        dateOfBirth: z.string().max(20).optional(),
        placeOfBirth: z.string().max(100).optional(),
        nationality: z.string().max(100).optional(),
        currentAddress: z.string().max(255).optional(),
        whatsappPhone: z.string().max(50),
        email: z.string().email().max(320),
        
        // Passeport
        passportNumber: z.string().max(64).optional(),
        passportCountry: z.string().max(100).optional(),
        passportIssueDate: z.string().max(20).optional(),
        passportExpiryDate: z.string().max(20).optional(),
        passportCopyAvailable: z.boolean().default(false),
        oldPassportAvailable: z.boolean().default(false),
        idCardAvailable: z.boolean().default(false),
        
        // Famille
        maritalStatus: z.enum(["celibataire", "marie", "divorce", "veuf", "union_libre"]).optional(),
        spouseName: z.string().max(255).optional(),
        numberOfChildren: z.number().int().min(0).max(20).default(0),
        dependents: z.number().int().min(0).max(20).default(0),
        familyInDestination: z.boolean().default(false),
        familyMemberRelation: z.string().max(100).optional(),
        familyMemberStatus: z.string().max(100).optional(),
        
        // Études
        educationLevel: z.string().max(100).optional(),
        latestDiploma: z.string().max(255).optional(),
        fieldOfStudy: z.string().max(100).optional(),
        diplomaYear: z.number().int().min(1900).max(2030).optional(),
        institution: z.string().max(255).optional(),
        diplomasAvailable: z.boolean().default(false),
        
        // Emploi
        currentProfession: z.string().max(255).optional(),
        currentEmployer: z.string().max(255).optional(),
        yearsOfExperience: z.number().int().min(0).max(60).optional(),
        previousExperiences: z.string().optional(), // JSON
        monthlyIncome: z.number().min(0).optional(),
        cvAvailable: z.boolean().default(false),
        jobOfferAvailable: z.boolean().default(false),
        
        // Finances
        bankBalance: z.number().min(0).optional(),
        bankBalanceAverage6Months: z.number().min(0).optional(),
        hasSponsor: z.boolean().default(false),
        sponsorName: z.string().max(255).optional(),
        fundSource: z.string().max(255).optional(),
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
        specialNeeds: z.string().max(2000).optional(),
        
        // Documents
        documentsAvailable: z.string().optional(), // JSON
        
        // Conditionnel: Étudiant
        desiredProgram: z.string().max(255).optional(),
        desiredEducationLevel: z.string().max(100).optional(),
        targetInstitution: z.string().max(255).optional(),
        admissionLetterAvailable: z.boolean().default(false),
        intendedStartDate: z.string().max(20).optional(),
        studyBudget: z.number().min(0).optional(),
        studyFunder: z.string().max(255).optional(),
        academicProject: z.string().max(2000).optional(),
        postStudiesProject: z.string().max(2000).optional(),
        companions: z.string().optional(), // JSON
        
        // Conditionnel: Visiteur
        visitReason: z.string().max(500).optional(),
        visitType: z.enum(["tourism", "family", "business", "event", "other"]).optional(),
        plannedStayDuration: z.string().max(50).optional(),
        estimatedTravelDate: z.string().max(20).optional(),
        plannedAccommodation: z.string().max(255).optional(),
        invitingPerson: z.string().max(255).optional(),
        invitationLetterAvailable: z.boolean().default(false),
        stayFunder: z.string().max(255).optional(),
        tiesInHomeCountry: z.string().optional(), // JSON
        
        // Conditionnel: Travailleur
        desiredPosition: z.string().max(255).optional(),
        targetCity: z.string().max(100).optional(),
        relatedExperience: z.number().int().min(0).max(60).optional(),
        relatedDiplomas: z.string().optional(), // JSON
        languageLevel: z.string().max(100).optional(),
        departureAvailability: z.string().max(100).optional(),
        
        // Conditionnel: Résidence permanente
        targetCategory: z.string().max(100).optional(),
        age: z.number().int().min(0).max(120).optional(),
        ecaAvailable: z.boolean().default(false),
        experienceYears: z.number().int().min(0).max(60).optional(),
        experienceInDestination: z.boolean().default(false),
        provincialNomination: z.boolean().default(false),
        availableFunds: z.number().min(0).optional(),
        policeCertificatesAvailable: z.boolean().default(false),
        
        submissionNotes: z.string().max(2000).optional(),
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
    .input(z.object({ id: z.number().int().positive() }))
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
