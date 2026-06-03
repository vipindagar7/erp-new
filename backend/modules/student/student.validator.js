import { z } from "zod";

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(source === "body" ? req.body : req.query);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  req.validatedData = result.data;
  next();
};

export const paginationSchema = z.object({
  page:              z.coerce.number().int().min(1).default(1),
  limit:             z.coerce.number().int().min(1).max(500).default(20),
  search:            z.string().optional(),
  // Single-value filters
  dept_id:           z.string().uuid().optional(),
  section_id:        z.string().uuid().optional(),
  course_id:         z.string().uuid().optional(),
  program_id:        z.string().uuid().optional(),
  // Multi-value filters (comma-separated UUIDs)
  dept_ids:          z.string().optional(),
  section_ids:       z.string().optional(),
  course_ids:        z.string().optional(),
  program_ids:       z.string().optional(),
  // Other filters
  gender:            z.enum(["MALE","FEMALE","OTHER"]).optional(),
  status:            z.enum(["ACTIVE","DETAINED","PASSED","LEFT","TRANSFERRED"]).optional(),
  batch_year:        z.coerce.number().int().optional(),
  academic_year:     z.string().optional(),
  semester:          z.coerce.number().int().min(1).max(8).optional(),
  session:           z.string().optional(),
  is_hosteller:      z.string().optional(),
  is_using_transport:z.string().optional(),
  isBlocked:         z.string().optional(),
  batch:             z.string().optional(),  // e.g. 2024-2028 — filters by section.batch
});

const studentBase = z.object({
  // Account
  email:    z.string().trim().email("Valid email required"),
  password: z.string().min(6).optional().default("Student@123"),
  // Name
  first_name:  z.string().min(1, "First name required"),
  last_name:   z.string().min(1, "Last name required"),
  // Identity
  roll_number:   z.string().min(1, "Roll number required"),
  enrollment_no: z.string().optional().nullable(),
  biometric_id:  z.string().optional().nullable(),
  group_no:      z.string().optional().nullable(),
  // Contact
  contact_number:     z.string().min(1, "Contact number required"),
  alt_contact_number: z.string().optional().nullable(),
  personal_email:     z.string().email().optional().nullable(),
  // Parents
  father_name:   z.string().min(1, "Father name required"),
  mother_name:   z.string().min(1, "Mother name required"),
  father_mobile: z.string().optional().nullable(),
  mother_mobile: z.string().optional().nullable(),
  // Personal
  gender:   z.enum(["MALE","FEMALE","OTHER"]).optional().nullable(),
  dob:      z.string().optional().nullable(),
  aadhar_no:z.string().optional().nullable(),
  pan_no:   z.string().optional().nullable(),
  nick_name:z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  // Admission
  mode_of_admission: z.string().optional().nullable(),
  admission_year:    z.coerce.number().int().optional().nullable(),
  admission_date:    z.string().optional().nullable(),
  session:           z.string().optional().nullable(),
  batch_year:        z.coerce.number().int().optional().nullable(),
  // Academic placement
  section_id:    z.string().uuid("Valid section required"),
  academic_year: z.string().min(1, "Academic year required"),
  semester:      z.coerce.number().int().min(1).max(8),
  // Hostel / transport
  is_hosteller:       z.boolean().optional().default(false),
  is_using_transport: z.boolean().optional().default(false),
  // Address
  local_address:          z.string().optional().nullable(),
  local_address_city:     z.string().optional().nullable(),
  local_address_state:    z.string().optional().nullable(),
  local_address_zipcode:  z.string().optional().nullable(),
  permanent_address:      z.string().optional().nullable(),
  permanent_address_city: z.string().optional().nullable(),
  permanent_address_state:z.string().optional().nullable(),
  permanent_address_zipcode: z.string().optional().nullable(),
});

export const createStudentSchema = studentBase;
export const updateStudentSchema = studentBase
  .omit({ email: true, password: true })
  .partial();