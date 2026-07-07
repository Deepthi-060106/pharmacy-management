CREATE DATABASE pharmacy;
USE pharmacy;

-- 1. CUSTOMERS
CREATE TABLE Customers (
    Customer_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(15),
    Email VARCHAR(100) UNIQUE  -- ✅ unique email
);

-- 2. ADMINS
CREATE TABLE Admins (
    Admin_ID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL
);

-- 3. MEDICINES
CREATE TABLE Medicines (
    Medicine_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Manufacturer VARCHAR(100),
    Price DECIMAL(10,2) NOT NULL,
    Stock_Quantity INT NOT NULL,
    Batch_No VARCHAR(50) NOT NULL,
    Expiry_Date DATE NOT NULL
);

-- 4. PRESCRIPTIONS (1 customer → many prescriptions; 1 prescription → many medicines via junction table)
CREATE TABLE Prescriptions (
    Prescription_ID INT PRIMARY KEY AUTO_INCREMENT,
    Doctor_Name VARCHAR(100) NOT NULL,
    Date_Issued DATE NOT NULL,
    Customer_ID INT NOT NULL,
    Duration VARCHAR(50),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE
);

-- Junction table for prescription medicines
CREATE TABLE Prescription_Medicines (
    Prescription_ID INT NOT NULL,
    Medicine_ID INT NOT NULL,
    Dosage VARCHAR(50) NOT NULL,
    PRIMARY KEY (Prescription_ID, Medicine_ID),
    FOREIGN KEY (Prescription_ID) REFERENCES Prescriptions(Prescription_ID) ON DELETE CASCADE,
    FOREIGN KEY (Medicine_ID) REFERENCES Medicines(Medicine_ID) ON DELETE CASCADE
);

-- 5. SALES
CREATE TABLE Sales (
    Sale_ID INT PRIMARY KEY AUTO_INCREMENT,
    Payment_Method VARCHAR(20) NOT NULL,
    Date DATE NOT NULL,
    Total_Amount DECIMAL(10,2) NOT NULL,
    Customer_ID INT NOT NULL,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE
);

-- Junction table for sales medicines
CREATE TABLE Sales_Contains (
    Sale_ID INT NOT NULL,
    Medicine_ID INT NOT NULL,
    Unit_Price DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL,
    PRIMARY KEY (Sale_ID, Medicine_ID),
    FOREIGN KEY (Sale_ID) REFERENCES Sales(Sale_ID) ON DELETE CASCADE,
    FOREIGN KEY (Medicine_ID) REFERENCES Medicines(Medicine_ID) ON DELETE CASCADE
);
