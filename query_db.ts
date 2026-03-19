import { db } from "./src/lib/db.js";

async function main() {
  const res1 = await db.execute("PRAGMA table_info(orders);");
  console.log("orders:", res1.rows);
  const res2 = await db.execute("PRAGMA table_info(order_items);");
  console.log("order_items:", res2.rows);
}

main();
