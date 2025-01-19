/**
 * Creates the initial structure of the Google Sheet with tabs, headers, and formulas.
 * Adds checks for existing data and prompts the user before overwriting.
 */
function setupGoogleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Define tabs and headers
  const tabs = {
    "Cars": [
      "Car ID", "Make", "Model", "Year", "Color",
      "Registration Number", "Purchase Price (SAR)",
      "Purchase Date", "Current Status", "Condition",
      "Seller Name", "Seller Contact",
      "Transport Cost (SAR)", "Inspection Cost (SAR)",
      "Other Cost (SAR)", "Total Cost (SAR)",
      "Location", "Documents", "Photo", "Investment Split",
      "Profit/Loss", "Partner Returns"
    ],
    "Repairs": [
      "Repair ID", "Car ID", "Repair Date",
      "Repair Description", "Repair Cost (SAR)",
      "Mechanic Name", "Service Provider Name",
      "Service Provider Contact", "Service Provider Address"
    ],
    "Sales": [
      "Sale ID", "Car ID", "Sale Date",
      "Sale Price (SAR)", "Buyer Name",
      "Buyer Contact Info", "Profit (SAR)",
      "Payment Status", "Total Repair Costs (SAR)",
      "Net Profit (SAR)"
    ],
    "Partners": [
      "Partner ID", "Name", "Contact Info", "Partner Net Profit (SAR)",
      "Role"
    ],
    "Rentals": [
      "Rental ID", "Car ID", "Customer Name", "Customer Contact",
      "Start Date", "Return Date", "Days Left", "Days Out",
      "Daily Rate (SAR)", "Total Rent Earned (SAR)",
      "Damage Fee (SAR)", "Late Fee (SAR)", "Other Fee (SAR)",
      "Additional Costs Description", "Rental Status"
    ]
  };

  // Check if the sheet is completely empty
  if (ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0) {
    // Sheet is empty, proceed with setup
    createTabsAndHeaders(ss, tabs);
  } else {
    // Sheet has content, prompt before overwriting
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "Setup Confirmation",
      "Running setup will clear existing data in the sheet. Are you sure you want to proceed?",
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      createTabsAndHeaders(ss, tabs);
    } else {
      ui.alert("Setup Cancelled", "Sheet setup was cancelled.", ui.ButtonSet.OK);
      return; // Exit the function if the user cancels
    }
  }
}

function createTabsAndHeaders(ss, tabs) {
  // Create and populate each tab
  for (const [tabName, headers] of Object.entries(tabs)) {
    let sheetTab = ss.getSheetByName(tabName);
    if (!sheetTab) {
      sheetTab = ss.insertSheet(tabName);
    } else {
      sheetTab.clearContents().clearFormats(); // Clear only contents and formats, keep formulas if any
    }

    // Write the header row
    const headerRange = sheetTab.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    sheetTab.setFrozenRows(1);
  }

  // Seed with dummy data
  seedDummyData(ss);

  // Add formulas to the sheets AFTER seeding data
  for (const tabName of Object.keys(tabs)) {
    const sheetTab = ss.getSheetByName(tabName);
    addFormulasToSheet(sheetTab, tabName);
  }

  // Remove the default "Sheet1" if it's still empty
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }
}

function addFormulasToSheet(sheetTab, tabName) {
  if (tabName === "Cars") {
    // Total Cost (SAR) formula
    const totalCostFormula = `=IF(OR(G2="", M2="", N2="", O2=""), "", SUM(G2, M2:O2))`;
    sheetTab.getRange("P2:P").setFormula(totalCostFormula);

    // Current Status formula (check for empty Car ID)
    const currentStatusFormula = `=IF(A2="", "", IFERROR(
      IFS(
        COUNTIF(Sales!B:B, A2) > 0, "Sold",
        COUNTIFS(Rentals!B:B, A2, Rentals!O:O, "Active") > 0, "On Rent",
        TRUE, "Available"
      ),
      "Available"
    ))`;
    sheetTab.getRange("I2:I").setFormula(currentStatusFormula);

    // Profit/Loss formula
    const profitLossFormula = `=IF(A2="", "", P2 + SUMIF(Repairs!B:B, A2, Repairs!E:E) - SUMIF(Rentals!B:B, A2, Rentals!J:J) - IFERROR(VLOOKUP(A2, Sales!B:D, 3, FALSE), 0))`;
    sheetTab.getRange("U2:U").setFormula(profitLossFormula);

    // Partner Returns formula
    const partnerReturnsFormula = `=IF(A2="", "",
    IFERROR(
      TEXTJOIN(",", TRUE,
        ARRAYFORMULA(
          VALUE(SPLIT(T2, ",")) * U2
        )
      ),
      ""
    )
  )`;
    sheetTab.getRange("V2:V").setFormula(partnerReturnsFormula);

  } else if (tabName === "Sales") {
    // Total Repair Costs (SAR) formula
    const totalRepairCostsFormula = `=IF(B2="", "", SUMIF(Repairs!B:B, B2, Repairs!E:E))`;
    sheetTab.getRange("I2:I").setFormula(totalRepairCostsFormula);

    // Profit (SAR) formula
    const profitFormula = `=IF(OR(D2="", B2=""), "", D2 - VLOOKUP(B2, Cars!A:P, 16, FALSE))`;
    sheetTab.getRange("G2:G").setFormula(profitFormula);

    // Net Profit (SAR) formula
    const netProfitFormula = `=IF(OR(G2="", I2=""), "", G2 - I2)`;
    sheetTab.getRange("J2:J").setFormula(netProfitFormula);

  } else if (tabName === "Partners") {
    // Partner Net Profit Formulas
    
    // Partner 1 (D2) - Sums the first value from each row in 'Partner Returns'
    const netProfitFormulaPartner1 = `=SUM(ARRAYFORMULA(IFERROR(VALUE(INDEX(SPLIT(Cars!V:V, ","), , 1)), 0)))`;
    sheetTab.getRange("D2").setFormula(netProfitFormulaPartner1);

    // Partner 2 (D3) - Sums the second value
    const netProfitFormulaPartner2 = `=SUM(ARRAYFORMULA(IFERROR(VALUE(INDEX(SPLIT(Cars!V:V, ","), , 2)), 0)))`;
    sheetTab.getRange("D3").setFormula(netProfitFormulaPartner2);

    // Partner 3 (D4) - Sums the third value
    const netProfitFormulaPartner3 = `=SUM(ARRAYFORMULA(IFERROR(VALUE(INDEX(SPLIT(Cars!V:V, ","), , 3)), 0)))`;
    sheetTab.getRange("D4").setFormula(netProfitFormulaPartner3);

  } else if (tabName === "Rentals") {
    // Days Left formula
    const daysLeftFormula = `=IF(OR(E2="", F2=""), "", VALUE(F2) - VALUE(TODAY()))`;
    sheetTab.getRange("G2:G").setFormula(daysLeftFormula);

    // Days Out formula
    const daysOutFormula = `=IF(OR(E2="", F2=""), "", MAX(0, VALUE(TODAY()) - VALUE(E2)))`;
    sheetTab.getRange("H2:H").setFormula(daysOutFormula);

    // Total Rent Earned (SAR) formula
    const totalRentFormula = `=IF(OR(H2="", I2=""), "", (H2 * I2) + SUM(K2:M2))`;
    sheetTab.getRange("J2:J").setFormula(totalRentFormula);

    // Rental Status formula
    const rentalStatusFormula = `=IF(OR(ISBLANK(G2), G2=""), "", IF(G2 <= 0, "Completed", "Active"))`;
    sheetTab.getRange("O2:O").setFormula(rentalStatusFormula);
  }
}

/**
 * Seeds the Google Sheet with dummy data.
 */
function seedDummyData(ss) {
  // Dummy data
  const dummyData = {
    "Cars": [
      ["C1", "Toyota", "Corolla", 2020, "White", "REG1234", 50000, "2024-01-15", null, "Good", "Mohamed", "501234567", 500, 200, 100, null, "Riyadh", "Docs Available", "https://example.com/photo1.jpg", "0.30,0.40,0.30", null, null],
      ["C2", "Honda", "Civic", 2019, "Black", "REG5678", 45000, "2024-02-10", null, "Excellent", "Osama", "509876543", 300, 150, 0, null, "Jeddah", "Docs Available", "https://example.com/photo2.jpg", "0.50,0.20,0.30", null, null],
      ["C3", "Ford", "Focus", 2021, "Red", "REG1122", 53000, "2024-03-20", null, "Like New", "Layla", "502244668", 600, 200, 200, null, "Dammam", "Docs Available", "https://example.com/photo3.jpg", "0.40,0.40,0.20", null, null],
      ["C4", "Chevrolet", "Spark", 2018, "Blue", "REG3344", 32000, "2024-04-12", null, "Good", "Hassan", "542134578", 450, 150, 100, null, "Medina", "Docs Available", "https://example.com/photo4.jpg", "0.25,0.50,0.25", null, null],
      ["C5", "BMW", "3 Series", 2022, "Gray", "REG5566", 80000, "2024-05-01", null, "Excellent", "Fatima", "512121212", 1000, 500, 400, null, "Abha", "Docs Available", "https://example.com/photo5.jpg", "0.33,0.33,0.34", null, null],
      ["C6", "Mercedes", "C-Class", 2021, "Silver", "REG7788", 120000, "2024-06-30", null, "Like New", "Ali", "500001111", 750, 300, 250, null, "Taif", "Docs Available", "https://example.com/photo6.jpg", "0.60,0.20,0.20", null, null],
      ["C7", "Hyundai", "Elantra", 2017, "White", "REG9999", 28000, "2024-07-15", null, "Fair", "Ibrahim", "533334444", 350, 100, 50, null, "Buraydah", "Docs Available", "https://example.com/photo7.jpg", "0.45,0.30,0.25", null, null],
      ["C8", "Toyota", "Fortuner", 2017, "White", "abd342", 71600, "2025-01-14", null, "Used", "Muzammil Khan", "9515515529", 500, 250, 100, null, "Jubail", "Docs Available", "https://example.com/photo8.jpg", "0.33,0.33,0.34", null, null]
    ],
    "Repairs": [
      ["R1", "C1", "2024-03-01", "Oil Change", 200, "John Mechanic", "CarFix Inc.", "504442222", "Area 1, City"],
      ["R2", "C2", "2024-04-15", "Brake Pads Replacement", 600, "Doe Mechanic", "CarFix Pro", "503332211", "Area 2, City"],
      ["R3", "C3", "2024-05-05", "Transmission Check", 900, "Mike Mechanic", "GearHeads", "501230000", "Industrial Area"],
      ["R4", "C5", "2024-06-10", "Engine Tune-up", 1200, "John Mechanic", "CarFix Inc.", "504442222", "Area 1, City"],
      ["R5", "C7", "2024-07-20", "Wheel Alignment", 350, "Doe Mechanic", "CarFix Pro", "503332211", "Area 2, City"],
      ["R6", "C6", "2024-08-02", "AC Repair", 800, "Sam Mechanic", "CoolAir Shop", "505678901", "District 5, City"],
      ["R7", "C1", "2025-01-08", "asdf", 200, "asd", "asd", "123", "123 saf"]
    ],
    "Sales": [
      ["S1", "C2", "2024-05-01", 52000, "Alice", "alice@example.com", null, "Paid", null, null],
      ["S2", "C5", "2024-08-10", 83000, "Bob", "bob@example.com", null, "Pending", null, null],
      ["S3", "C7", "2024-08-15", 30000, "Charlie", "charlie@example.com", null, "Paid", null, null],
      ["S4", "C8", "2025-01-14", 81600, "Azam", "502156404", null, "Paid", null, null]
    ],
    "Partners": [
      ["P1", "Mohammed Azam Khan","azam.zamk@gmail.com", null, "Investor"],
      ["P2", "Mohammed Imran","imran@example.com", null, "Investor"],
      ["P3", "Mohammed Ali Khan", "ali@example.com", null, "Investor"]
    ],
    "Rentals": [
      ["RN1", "C2", "Customer A", "501112222", "2024-01-15", "2025-01-20", null, null, 250, null, null, null, null, null, null],
      ["RN2", "C1", "Customer B", "502223333", "2024-03-01", "2025-03-01", null, null, 300, null, null, null, null, null, null]
    ]
  };

  // Write the dummy data to each sheet
  for (const tabName of Object.keys(dummyData)) {
    const sheetTab = ss.getSheetByName(tabName);
    if (sheetTab && dummyData[tabName]) {
      const data = dummyData[tabName];
      sheetTab.getRange(2, 1, data.length, data[0].length).setValues(data);
    }
  }
}