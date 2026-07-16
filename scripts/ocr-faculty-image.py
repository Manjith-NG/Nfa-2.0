"""Extract faculty rows from screenshot and write import CSV."""
from __future__ import annotations

import re
import sys
from pathlib import Path

import easyocr

IMAGE = Path(
    r"C:\Users\Manjith\.cursor\projects\c-Users-Manjith-Downloads-NFA-2-0-main-1-NFA-2-0-main"
    r"\assets\c__Users_Manjith_AppData_Roaming_Cursor_User_workspaceStorage_1ee9bd0399cec2755be4a6c4512aca5c_images_image-737f5dbd-2c1f-4c40-a588-95b9ed163c61.png"
)
OUT = Path(__file__).resolve().parent.parent / "data" / "faculty-upload-batch2.csv"

EMAIL_RE = re.compile(
    r"([a-zA-Z0-9._%+-]+@(?:gcu\.edu\.in|gardencity\.university))",
    re.I,
)
ID_RE = re.compile(r"^\d{3,5}$")
DEPT_CODES = {
    "SNHS", "SOC", "SET", "MGMT", "PHY", "CHE", "MAT", "BIO", "PSY", "COM", "COMM",
    "LAW", "ARCH", "FAD", "ASH", "ADMIN", "BUS", "SCI", "HP", "CS", "DOM", "EM", "ENG",
    "HM", "LS", "FS", "LIB", "PLAC", "REG_OFF", "EXAM", "IQAC_OFF", "ENGLISH", "PS",
}
ROLE_CODES = {"FACULTY", "REGISTRAR", "OFC", "DEAN", "HOD", "COE", "ADMIN"}


def parse_line(text: str) -> dict | None:
    email_match = EMAIL_RE.search(text)
    if not email_match:
        return None
    email = email_match.group(1).lower()
    before, after = text[: email_match.start()], text[email_match.end() :]

    tokens = re.split(r"\s+", before.strip())
    employee_id = None
    name_parts: list[str] = []
    for token in tokens:
        if ID_RE.match(token):
            employee_id = token
            continue
        if token and not ID_RE.match(token):
            name_parts.append(token)

    if not employee_id:
        id_in_line = re.search(r"\b(\d{3,5})\b", before)
        if id_in_line:
            employee_id = id_in_line.group(1)

    after_tokens = re.split(r"\s+", after.strip())
    dept = designation = position = password = None

    for token in after_tokens:
        upper = token.upper()
        if upper in DEPT_CODES and not dept:
            dept = "COMM" if upper == "COM" else upper
            continue
        if upper in ROLE_CODES and not designation:
            designation = upper
            continue
        if "password" in token.lower():
            password = "password123"
            continue
        if token and not position and designation:
            position = token.upper()

    if not employee_id or not dept:
        return None

    full_name = " ".join(name_parts).strip()
    name_bits = full_name.split()
    if len(name_bits) >= 2:
        first_name = name_bits[0].title()
        last_name = " ".join(name_bits[1:]).title()
    elif len(name_bits) == 1:
        first_name = name_bits[0].title()
        last_name = name_bits[0].title()
    else:
        local = email.split("@")[0]
        parts = re.split(r"[._-]+", local)
        first_name = (parts[0] or "Faculty").title()
        last_name = (parts[-1] if len(parts) > 1 else parts[0] or "User").title()

    if designation in {"REGISTRAR", "OFC", "DEAN"}:
        position = designation
    elif position:
        position = position.replace("ASST_PRO", "ASST_PROFESSOR").replace("PROF", "PROFESSOR")
        if position.startswith("P1D") or position.startswith("AEST"):
            position = "ASST_PROFESSOR"
    else:
        position = "ASST_PROFESSOR"

    if designation == "FACULTY" or not designation:
        designation = "FACULTY"

    return {
        "employeeId": employee_id,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "phone": "",
        "departmentCode": dept,
        "designationCode": designation,
        "positionCode": position,
        "password": password or "password123",
    }


def main() -> int:
    if not IMAGE.exists():
        print(f"Image not found: {IMAGE}", file=sys.stderr)
        return 1

    print(f"OCR reading {IMAGE} ...")
    reader = easyocr.Reader(["en"], gpu=False)
    results = reader.readtext(str(IMAGE), detail=0, paragraph=False)

    rows: list[dict] = []
    seen: set[str] = set()

    for line in results:
        parsed = parse_line(line)
        if not parsed:
            continue
        key = parsed["employeeId"]
        if key in seen:
            continue
        seen.add(key)
        rows.append(parsed)

    rows.sort(key=lambda r: int(r["employeeId"]))

    header = (
        "employeeId,email,firstName,lastName,phone,departmentCode,designationCode,positionCode,password"
    )
    lines = [header]
    for row in rows:
        lines.append(
            ",".join(
                [
                    row["employeeId"],
                    row["email"],
                    row["firstName"],
                    row["lastName"],
                    row["phone"],
                    row["departmentCode"],
                    row["designationCode"],
                    row["positionCode"],
                    row["password"],
                ]
            )
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {OUT}")
    if rows[:3]:
        print("Sample:", rows[:3])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
