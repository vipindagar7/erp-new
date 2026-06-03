// Prisma known request errors (unique constraint, FK violation, not found, etc.)
  if (err.code && String(err.code).startsWith("P")) {
    const prismaMessages = {
      P2002: `Duplicate value: ${err.meta?.target?.join(", ") || "a unique field"} already exists.`,
      P2003: "Cannot complete: a referenced record does not exist.",
      P2025: "Record not found.",
      P2014: "Cannot delete: this record is referenced by other records.",
    };
    const message = prismaMessages[err.code] || `Database error (${err.code})`;
    console.error(`[Prisma ${err.code}] ${req.method} ${req.path} —`, message);
    return res.status(400).json({ success: false, message });
  }
 
  // Prisma validation errors — full message is huge and contains internal paths
  if (err.name === "PrismaClientValidationError") {
    const firstLine = err.message
      ?.split("\n")
      .find((l) => l.trim() && !l.includes("prisma.") && !l.includes("at "))
      || "Invalid data sent to database";
    console.error(`[PrismaValidation] ${req.method} ${req.path} —`, firstLine);
    return res.status(400).json({ success: false, message: firstLine.trim() });
  }
 
  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
 
  if (status >= 500) {
    console.error(`[${status}] ${req.method} ${req.path} —`, err.message);
    if (process.env.NODE_ENV === "development") console.error(err.stack);
  }
 
  return res.status(status).json({ success: false, message });