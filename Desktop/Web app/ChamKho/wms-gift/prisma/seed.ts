// ============================================================
// WMS Gift - Seed Data
// Dữ liệu thực tế cho shop Gifts bán Amazon FBA
// ============================================================

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Bắt đầu seed dữ liệu...\n");

    // ============================================================
    // 0. CATEGORIES - Danh mục & BOM Templates
    // ============================================================
    console.log("🗂️ Tạo Categories...");
    const categoriesData = [
        { code: "JAR", name: "Positive Jar", description: "All jar products", icon: "🫙", color: "#F59E0B", sort_order: 1 },
        { code: "ORN", name: "Ornament", description: "Ceramic & Acrylic ornaments", icon: "🎄", color: "#3B82F6", sort_order: 2 },
        { code: "DSK", name: "Desk Decor", description: "Decorative desk pieces", icon: "🏺", color: "#8B5CF6", sort_order: 3 },
        { code: "OTH", name: "Khác", description: "Other accessories", icon: "🎁", color: "#6B7280", sort_order: 4 }
    ];

    const categories: Record<string, any> = {};
    for (const cat of categoriesData) {
        categories[cat.code] = await prisma.productCategory.upsert({
            where: { code: cat.code },
            update: cat,
            create: cat
        });
    }
    console.log(`   ✅ ${categoriesData.length} categories đã tạo\n`);

    // ============================================================
    // 1. SUPPLIERS - Nhà cung cấp
    // ============================================================
    console.log("📦 Tạo Suppliers...");

    const suppliers = await Promise.all([
        prisma.supplier.upsert({
            where: { supplierCode: "SUP-VN-001" },
            update: {},
            create: {
                supplierCode: "SUP-VN-001",
                supplierName: "Xưởng In Minh Châu",
                country: "Việt Nam",
                contactPerson: "Anh Minh",
                paymentTerms: "COD hoặc CK trước 50%",
                currency: "VND",
                leadTimeDays: 5,
                rating: 5.0,
            },
        }),
        prisma.supplier.upsert({
            where: { supplierCode: "SUP-VN-002" },
            update: {},
            create: {
                supplierCode: "SUP-VN-002",
                supplierName: "Công ty Bao Bì Phú Thịnh",
                country: "Việt Nam",
                contactPerson: "Chị Thịnh",
                paymentTerms: "CK trước 30%, còn lại khi nhận hàng",
                currency: "VND",
                leadTimeDays: 7,
                rating: 4.0,
            },
        }),
        prisma.supplier.upsert({
            where: { supplierCode: "SUP-VN-003" },
            update: {},
            create: {
                supplierCode: "SUP-VN-003",
                supplierName: "Xưởng Thủ Công Mỹ Nghệ Hà Nội",
                country: "Việt Nam",
                contactPerson: "Anh Hùng",
                paymentTerms: "CK trước 100%",
                currency: "VND",
                leadTimeDays: 10,
                rating: 4.0,
            },
        }),
    ]);
    console.log(`   ✅ ${suppliers.length} suppliers đã tạo\n`);

    // ============================================================
    // 2. MATERIALS - Nguyên vật liệu
    // ============================================================
    console.log("🧱 Tạo Materials...");

    const materialsData = [
        { materialCode: "MAT-001", materialName: "Lọ thủy tinh 250ml", category: "Positive Jar", unit: "pcs", currentStock: 300, minStock: 100, reorderQty: 200, avgUnitCost: 15000, storageLocation: "Kệ A1" },
        { materialCode: "MAT-002", materialName: "Tem dán nắp lọ (in màu)", category: "Positive Jar", unit: "pcs", currentStock: 1000, minStock: 300, reorderQty: 700, avgUnitCost: 800, storageLocation: "Kệ A2" },
        { materialCode: "MAT-003", materialName: "Tem dán thân lọ (in màu)", category: "Positive Jar", unit: "pcs", currentStock: 1000, minStock: 300, reorderQty: 700, avgUnitCost: 1000, storageLocation: "Kệ A2" },
        { materialCode: "MAT-004", materialName: "Bộ 60 card (in 2 mặt, cắt sẵn)", category: "Positive Jar", unit: "set", currentStock: 500, minStock: 150, reorderQty: 350, avgUnitCost: 25000, storageLocation: "Kệ A3" },
        { materialCode: "MAT-005", materialName: "Thiệp cảm ơn (thank you card)", category: "Dùng chung", unit: "pcs", currentStock: 800, minStock: 200, reorderQty: 600, avgUnitCost: 2000, storageLocation: "Kệ A4" },
        { materialCode: "MAT-006", materialName: "Hộp đựng Positive Jar (kraft có cửa sổ)", category: "Positive Jar", unit: "pcs", currentStock: 400, minStock: 120, reorderQty: 280, avgUnitCost: 12000, storageLocation: "Kệ B1" },
        { materialCode: "MAT-007", materialName: "Sticker seal hộp", category: "Positive Jar", unit: "pcs", currentStock: 2000, minStock: 500, reorderQty: 1500, avgUnitCost: 500, storageLocation: "Kệ B2" },
        { materialCode: "MAT-008", materialName: "Ornament tròn ceramic 3 inch", category: "Ornament", unit: "pcs", currentStock: 200, minStock: 60, reorderQty: 140, avgUnitCost: 35000, storageLocation: "Kệ C1" },
        { materialCode: "MAT-009", materialName: "Hộp đựng ornament (foam insert)", category: "Ornament", unit: "pcs", currentStock: 200, minStock: 60, reorderQty: 140, avgUnitCost: 8000, storageLocation: "Kệ C2" },
        { materialCode: "MAT-010", materialName: "Túi bóng kính OPP", category: "Ornament", unit: "pcs", currentStock: 1000, minStock: 300, reorderQty: 700, avgUnitCost: 1500, storageLocation: "Kệ C3" },
        { materialCode: "MAT-011", materialName: "Bubble wrap 30x30cm", category: "Dùng chung", unit: "pcs", currentStock: 500, minStock: 150, reorderQty: 350, avgUnitCost: 1500, storageLocation: "Kệ D1" },
        { materialCode: "MAT-012", materialName: "Nhãn FNSKU (giấy in nhiệt)", category: "Dùng chung", unit: "pcs", currentStock: 3000, minStock: 500, reorderQty: 2500, avgUnitCost: 300, storageLocation: "Kệ D2" },
        { materialCode: "MAT-013", materialName: "Thùng carton xuất FBA (60x40x40cm)", category: "Dùng chung", unit: "pcs", currentStock: 50, minStock: 10, reorderQty: 40, avgUnitCost: 35000, storageLocation: "Kệ D3" },
    ];

    const materials: Record<string, { id: string }> = {};
    for (const mat of materialsData) {
        const created = await prisma.material.upsert({
            where: { materialCode: mat.materialCode },
            update: {},
            create: mat,
        });
        materials[mat.materialCode] = created;
    }
    console.log(`   ✅ ${Object.keys(materials).length} materials đã tạo\n`);

    // ============================================================
    // 2.5 BOM TEMPLATES
    // ============================================================
    console.log("📝 Tạo BOM Templates...");
    await prisma.bOMTemplate.deleteMany({});

    // Template JAR 
    const jarTemplates = [
        { materialCode: "MAT-006", qty: 1 },
        { materialCode: "MAT-007", qty: 2 },
        { materialCode: "MAT-005", qty: 1 },
        { materialCode: "MAT-011", qty: 1 },
        { materialCode: "MAT-012", qty: 1 }
    ];
    for (const item of jarTemplates) {
        await prisma.bOMTemplate.create({
            data: { category_id: categories["JAR"].id, material_id: materials[item.materialCode].id, quantity_per_unit: item.qty }
        });
    }

    // Template ORN
    const ornTemplates = [
        { materialCode: "MAT-009", qty: 1 },
        { materialCode: "MAT-010", qty: 1 },
        { materialCode: "MAT-005", qty: 1 },
        { materialCode: "MAT-011", qty: 1 },
        { materialCode: "MAT-012", qty: 1 }
    ];
    for (const item of ornTemplates) {
        await prisma.bOMTemplate.create({
            data: { category_id: categories["ORN"].id, material_id: materials[item.materialCode].id, quantity_per_unit: item.qty }
        });
    }

    // ============================================================
    // 3. PRODUCTS - Sản phẩm
    // ============================================================
    console.log("🎁 Tạo Products...");

    const productJar = await prisma.product.upsert({
        where: { skuCode: "GIFT-JAR-001" },
        update: { category_id: categories["JAR"].id, design_name: "Positive" },
        create: {
            skuCode: "GIFT-JAR-001",
            productName: "Positive Affirmation Jar with 60 Cards",
            category_id: categories["JAR"].id,
            design_name: "Positive",
            sellingPrice: 28.99, minStockFba: 80, leadTimeDays: 21, status: "ACTIVE"
        },
    });

    const productOrn = await prisma.product.upsert({
        where: { skuCode: "GIFT-ORN-001" },
        update: { category_id: categories["ORN"].id, design_name: "Ceramic Round" },
        create: {
            skuCode: "GIFT-ORN-001",
            productName: "Personalized Ceramic Ornament",
            category_id: categories["ORN"].id,
            design_name: "Ceramic Round",
            sellingPrice: 16.99, minStockFba: 100, leadTimeDays: 21, status: "ACTIVE"
        },
    });

    // 3 Sản Phẩm mới yêu cầu
    const productPkl = await prisma.product.upsert({
        where: { skuCode: "JAR-PKL-001" }, update: {},
        create: { skuCode: "JAR-PKL-001", productName: "Pickle Positive Jar", category_id: categories["JAR"].id, design_name: "Pickle", sellingPrice: 28.99, minStockFba: 100, leadTimeDays: 14 }
    });
    const productCat = await prisma.product.upsert({
        where: { skuCode: "JAR-CAT-001" }, update: {},
        create: { skuCode: "JAR-CAT-001", productName: "Cat Positive Jar", category_id: categories["JAR"].id, design_name: "Cat", sellingPrice: 28.99, minStockFba: 100, leadTimeDays: 14 }
    });
    const productStarOrn = await prisma.product.upsert({
        where: { skuCode: "ORN-ACR-001" }, update: {},
        create: { skuCode: "ORN-ACR-001", productName: "Acrylic Star Ornament", category_id: categories["ORN"].id, design_name: "Star", sellingPrice: 14.99, minStockFba: 150, leadTimeDays: 10 }
    });

    console.log(`   ✅ 5 products đã tạo\n`);

    // ============================================================
    // 4. BILL OF MATERIALS - Định mức NVL
    // ============================================================
    console.log("📋 Tạo Bill of Materials...");
    await prisma.billOfMaterial.deleteMany({});

    // MÁP VÀO SẢN PHẨM CHÍNH (GIFT TAB)
    const bomJarData = [
        { materialCode: "MAT-001", qty: 1, isFromTemp: false },
        { materialCode: "MAT-002", qty: 1, isFromTemp: false },
        { materialCode: "MAT-003", qty: 1, isFromTemp: false },
        { materialCode: "MAT-004", qty: 1, isFromTemp: false },
        { materialCode: "MAT-006", qty: 1, isFromTemp: true },
        { materialCode: "MAT-007", qty: 2, isFromTemp: true },
        { materialCode: "MAT-011", qty: 1, isFromTemp: true },
        { materialCode: "MAT-012", qty: 1, isFromTemp: true },
        { materialCode: "MAT-005", qty: 1, isFromTemp: true }
    ];
    for (const item of bomJarData) {
        await prisma.billOfMaterial.create({
            data: {
                productId: productJar.id, materialId: materials[item.materialCode].id,
                quantityPerUnit: item.qty, is_from_template: item.isFromTemp
            }
        });
    }

    const bomPklData = [
        { materialCode: "MAT-001", qty: 1, isFromTemp: false },
        { materialCode: "MAT-002", qty: 1, isFromTemp: false },
        { materialCode: "MAT-003", qty: 1, isFromTemp: false },
        { materialCode: "MAT-004", qty: 1, isFromTemp: false },
    ];
    for (const item of bomPklData) {
        await prisma.billOfMaterial.create({
            data: { productId: productPkl.id, materialId: materials[item.materialCode].id, quantityPerUnit: item.qty }
        })
    }

    for (const item of bomPklData) {
        await prisma.billOfMaterial.create({
            data: { productId: productCat.id, materialId: materials[item.materialCode].id, quantityPerUnit: item.qty }
        })
    }
    await prisma.billOfMaterial.create({
        data: { productId: productStarOrn.id, materialId: materials["MAT-008"].id, quantityPerUnit: 1 }
    });

    console.log(`   ✅ BOM entries đã tạo\n`);

    // (Employees & Others logic retained exactly as before)...
    // ============================================================
    // 5. EMPLOYEES - Nhân viên
    // ============================================================
    console.log("👥 Tạo Employees...");

    const employees = await Promise.all([
        prisma.employee.upsert({
            where: { employeeCode: "EMP-001" }, update: {},
            create: { employeeCode: "EMP-001", fullName: "Nguyễn Văn A", role: "ADMIN", salaryType: "MONTHLY", baseSalary: 15000000, hireDate: new Date("2024-01-15"), status: "ACTIVE" }
        }),
        prisma.employee.upsert({
            where: { employeeCode: "EMP-002" }, update: {},
            create: { employeeCode: "EMP-002", fullName: "Trần Thị B", role: "PRODUCTION", salaryType: "PER_UNIT", baseSalary: 2000, hireDate: new Date("2024-03-01"), status: "ACTIVE" }
        })
    ]);

    // FBA INVENTORY
    await prisma.fBAInventory.deleteMany({});
    await Promise.all([
        prisma.fBAInventory.create({ data: { productId: productJar.id, fulfillableQty: 45, inboundQty: 120, reservedQty: 5 } }),
        prisma.fBAInventory.create({ data: { productId: productOrn.id, fulfillableQty: 28, inboundQty: 80, reservedQty: 3 } }),
        prisma.fBAInventory.create({ data: { productId: productPkl.id, fulfillableQty: 0, inboundQty: 0, reservedQty: 0 } }),
        prisma.fBAInventory.create({ data: { productId: productCat.id, fulfillableQty: 0, inboundQty: 0, reservedQty: 0 } }),
        prisma.fBAInventory.create({ data: { productId: productStarOrn.id, fulfillableQty: 0, inboundQty: 0, reservedQty: 0 } })
    ]);

    console.log("🎉 SEED HOÀN TẤT!");
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => { console.error("❌ Seed thất bại:", e); await prisma.$disconnect(); process.exit(1); });
