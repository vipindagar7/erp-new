with open("/Users/vipindagar/Documents/EIT-web/erp-new/backend/prisma/schema.prisma") as f:

    schema = f.read()



lines = schema.split("\n")

in_student = False

fixed = 0



for i, line in enumerate(lines):

    if line.startswith("model Student {"):

        in_student = True

    if in_student and line == "}":

        in_student = False

        break



    if not in_student:

        continue



    # Make all scalar FK fields optional (String → String?)

    for field in ["dept_id", "program_id", "branch_id", "section_id", "course_id"]:

        if f"  {field}" in line and "String" in line and "?" not in line:

            lines[i] = line.replace("String", "String?")

            fixed += 1

            print(f"  L{i+1}: {lines[i].strip()}")



    # Make all relation fields optional (Model → Model?)

    for rel in ["department", "program", "branch", "section", "course"]:

        stripped = line.strip()

        if stripped.startswith(f"{rel} ") and "@relation" in line:

            # Find the type (e.g. Department, Program)

            parts = stripped.split()

            if len(parts) >= 2 and "?" not in parts[1]:

                lines[i] = line.replace(parts[1] + " ", parts[1] + "? ", 1)

                fixed += 1

                print(f"  L{i+1}: {lines[i].strip()}")



schema = "\n".join(lines)

with open("/Users/vipindagar/Documents/EIT-web/erp-new/backend/prisma/schema.prisma", "w") as f:

    f.write(schema)



print(f"\n✓ Fixed {fixed} fields")

print("Now run:")

print("  npx prisma db push")

print("  npx prisma generate")