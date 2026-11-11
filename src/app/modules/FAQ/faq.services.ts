import httpStatus from "http-status";
import { AppError } from "../../errors";
import { FAQ } from "./faq.model";
import type { IFAQ } from "./faq.interface";

// Initial seed FAQs for patient transport platform
const DEFAULT_FAQS: IFAQ[] = [
   {
      question: "How does GKV statutory health insurance ride coverage work?",
      answer:
         "If your doctor issues a medical transport prescription (Muster 4 / Verordnung einer Krankenbeförderung), statutory health insurance covers your trip minus the legally mandated co-payment (typically 10%, between €5 and €10 per ride, unless exempt). Our partner transport carriers bill directly with your Krankenkasse.",
      category: "Insurance & GKV",
      order: 1,
      isActive: true,
   },
   {
      question: "Can I book a wheelchair-accessible transport?",
      answer:
         "Yes. When selecting your transport type or booking with our partner organizations, you can choose wheelchair-accessible vehicles equipped with safety ramps and restraint systems.",
      category: "Vehicles & Assistance",
      order: 2,
      isActive: true,
   },
   {
      question: "What types of rides are covered by non-emergency medical transport?",
      answer:
         "Covered trips include hospital admissions and discharges, outpatient clinic appointments, regular dialysis treatments, oncology chemotherapy or radiation sessions, and certified rehabilitation transfers.",
      category: "Ride Types",
      order: 3,
      isActive: true,
   },
   {
      question: "How can I book a ride privately without health insurance?",
      answer:
         "Simply choose 'Private Booking' on our platform or on any organization's details page. You will receive transparent pricing and direct driver confirmation.",
      category: "Booking & Payment",
      order: 4,
      isActive: true,
   },
   {
      question: "How far in advance should I schedule my transport?",
      answer:
         "We recommend booking at least 24 to 48 hours before your appointment to ensure optimal driver assignment and scheduling, although urgent same-day bookings are accommodated based on carrier availability.",
      category: "General",
      order: 5,
      isActive: true,
   },
];

const createFAQ = async (payload: IFAQ) => {
   const faq = await FAQ.create(payload);
   return faq;
};

const getAllFAQs = async (query?: { category?: string; search?: string; all?: string }) => {
   // Seed if empty
   const count = await FAQ.countDocuments();
   if (count === 0) {
      await FAQ.insertMany(DEFAULT_FAQS);
   }

   const filter: Record<string, any> = {};

   // If not explicitly requesting all, return only active
   if (query?.all !== "true") {
      filter.isActive = true;
   }

   if (query?.category) {
      filter.category = query.category;
   }

   if (query?.search) {
      filter.$or = [
         { question: { $regex: query.search, $options: "i" } },
         { answer: { $regex: query.search, $options: "i" } },
      ];
   }

   return FAQ.find(filter).sort({ order: 1, createdAt: -1 });
};

const getSingleFAQ = async (id: string) => {
   const faq = await FAQ.findById(id);
   if (!faq) {
      throw new AppError(httpStatus.NOT_FOUND, "FAQ not found!");
   }
   return faq;
};

const updateFAQ = async (id: string, payload: Partial<IFAQ>) => {
   const faq = await FAQ.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
   if (!faq) {
      throw new AppError(httpStatus.NOT_FOUND, "FAQ not found!");
   }
   return faq;
};

const deleteFAQ = async (id: string) => {
   const faq = await FAQ.findByIdAndDelete(id);
   if (!faq) {
      throw new AppError(httpStatus.NOT_FOUND, "FAQ not found!");
   }
   return faq;
};

export const FAQServices = {
   createFAQ,
   getAllFAQs,
   getSingleFAQ,
   updateFAQ,
   deleteFAQ,
};

