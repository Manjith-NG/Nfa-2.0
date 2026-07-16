import bcrypt from "bcryptjs";

const hash = "$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q";
const ok = await bcrypt.compare("password123", hash);
console.log("password123 matches hash:", ok);
