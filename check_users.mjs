import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, employees } from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// List all users
console.log("=== ALL USERS ===");
const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
console.log(JSON.stringify(allUsers, null, 2));

// List all employees
console.log("\n=== ALL EMPLOYEES ===");
const allEmps = await db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, userId: employees.userId }).from(employees);
console.log(JSON.stringify(allEmps, null, 2));

await connection.end();
