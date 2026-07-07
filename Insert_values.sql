-- Insert admin into Admins table
INSERT INTO Admins (Username, Password)
VALUES ('admin', 'admin123');  -- In production, use hashed passwords

-- Insert some sample medicines
INSERT INTO Medicines (Name, Category, Manufacturer, Price, Stock_Quantity, Batch_No, Expiry_Date)
VALUES 
('Paracetamol', 'Painkiller', 'ABC Pharma', 20.00, 100, 'B001', '2026-12-31'),
('Amoxicillin', 'Antibiotic', 'XYZ Pharma', 50.00, 50, 'B002', '2025-11-30'),
('Cetirizine', 'Antihistamine', 'HealthCorp', 15.00, 200, 'B003', '2027-01-15'),
('Ibuprofen', 'Painkiller', 'MediCare', 25.00, 150, 'B004', '2026-06-30');
