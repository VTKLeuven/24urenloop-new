import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ 
                success: false, 
                message: 'No file uploaded' 
            }, { status: 400 });
        }

        // Use require for xlsx (works better in server-side)
        const XLSX = require('xlsx');
        
        // Read the Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON (assuming first row contains headers)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip the header row and process data
        const dataRows = jsonData.slice(1);
        
        const results = {
            totalRows: dataRows.length,
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            try {
                // Extract data from columns based on the Excel structure
                // Column indices: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9
                const voornaam = row[2]; // Column C
                const achternaam = row[3]; // Column D
                const rNummer = row[4]; // Column E
                const tijdInMinSec = row[6]; // Column G
                const schoenmaat = row[8]; // Column I

                // Validate required fields
                if (!voornaam || !achternaam || !rNummer) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: Missing required fields (Voornaam, Achternaam, or R-nummer)`);
                    continue;
                }

                // Clean and format the data
                const firstName = String(voornaam).trim();
                const lastName = String(achternaam).trim();
                const identification = String(rNummer).trim();
                const shoeSize = schoenmaat ? String(schoenmaat).trim() : "0";
                
                // Parse test time - DEBUG ALL METHODS
                let testTime = "0:00";

                if (tijdInMinSec) {
                    console.log(`=== DEBUGGING TIME PARSING ===`);
                    console.log(`Raw value: "${tijdInMinSec}"`);
                    console.log(`Type: ${typeof tijdInMinSec}`);
                    
                    const timeValue = parseFloat(String(tijdInMinSec));
                    console.log(`Parsed number: ${timeValue}`);

                    if (!isNaN(timeValue) && timeValue > 0) {
                        // Method 1: Excel fraction of day
                        const method1_seconds = timeValue * 24 * 60 * 60;
                        const method1_minutes = Math.floor(method1_seconds / 60);
                        const method1_secs = Math.floor(method1_seconds % 60);
                        console.log(`Method 1 (fraction of day): ${method1_minutes}:${method1_secs.toString().padStart(2,'0')}`);
                        
                        // Method 2: Direct decimal minutes (1.25 = 1 min 15 sec)
                        const method2_minutes = Math.floor(timeValue);
                        const method2_secs = Math.round((timeValue - method2_minutes) * 60);
                        console.log(`Method 2 (decimal minutes): ${method2_minutes}:${method2_secs.toString().padStart(2,'0')}`);
                        
                        // Method 3: If it's a very small number, maybe it's seconds
                        if (timeValue < 10) {
                            const method3_minutes = Math.floor(timeValue / 60);
                            const method3_secs = Math.floor(timeValue % 60);
                            console.log(`Method 3 (as seconds): ${method3_minutes}:${method3_secs.toString().padStart(2,'0')}`);
                        }
                        
                        // Method 4: Try multiplying by 60 (maybe it's hours?)
                        const method4_minutes = Math.floor(timeValue * 60);
                        const method4_secs = Math.floor((timeValue * 60 - method4_minutes) * 60);
                        console.log(`Method 4 (multiply by 60): ${method4_minutes}:${method4_secs.toString().padStart(2,'0')}`);
                        
                        // Method 5: Fraction of an hour (0.05 = 0.05 hours = 3 minutes)
                        const method5_minutes = Math.floor(timeValue * 60);
                        const method5_secs = Math.floor((timeValue * 60 - method5_minutes) * 60);
                        console.log(`Method 5 (fraction of hour): ${method5_minutes}:${method5_secs.toString().padStart(2,'0')}`);
                        
                        // Method 6: If it's very small, maybe it's fraction of a minute
                        if (timeValue < 1) {
                            const method6_seconds = Math.round(timeValue * 60);
                            const method6_minutes = Math.floor(method6_seconds / 60);
                            const method6_secs = method6_seconds % 60;
                            console.log(`Method 6 (fraction of minute): ${method6_minutes}:${method6_secs.toString().padStart(2,'0')}`);
                        }
                        
                        // Method 7: Based on your example: 0.05416666666860692 should be 1:18 (78 seconds)
                        // 0.05416666666860692 * 1440 = 78 minutes, but we want 78 seconds
                        // So: timeValue * 1440 gives us the total seconds we want
                        const method7_totalSeconds = Math.round(timeValue * 1440);
                        const method7_minutes = Math.floor(method7_totalSeconds / 60);
                        const method7_secs = method7_totalSeconds % 60;
                        console.log(`Method 7 (timeValue * 1440): ${method7_minutes}:${method7_secs.toString().padStart(2,'0')}`);
                        
                        // Method 8: Let's try a different approach - maybe it's stored as minutes directly
                        const method8_minutes = Math.floor(timeValue * 1440);
                        const method8_secs = Math.floor((timeValue * 1440 - method8_minutes) * 60);
                        console.log(`Method 8 (timeValue * 1440 as minutes): ${method8_minutes}:${method8_secs.toString().padStart(2,'0')}`);
                        
                        // Based on your example, Method 7 should give us 1:18
                        testTime = `${method7_minutes}:${method7_secs.toString().padStart(2,'0')}`;
                        console.log(`Using Method 7 result: ${testTime}`);
                        console.log(`=== END DEBUG ===`);
                    }
                }

                // Check if runner already exists
                const existingRunner = await prisma.runner.findUnique({
                    where: { identification }
                });

                if (existingRunner) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: Runner with identification ${identification} already exists`);
                    continue;
                }

                // Create new runner
                await prisma.runner.create({
                    data: {
                        firstName,
                        lastName,
                        identification,
                        facultyId: 1, // Default facultyId
                        groupNumber: 0, // Default groupNumber
                        testTime,
                        firstYear: false, // Default firstYear
                        shoeSize,
                    }
                });

                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        const success = results.failed === 0;
        const message = success 
            ? `Successfully uploaded ${results.successful} runners`
            : `Upload completed with ${results.successful} successful and ${results.failed} failed entries`;

        return NextResponse.json({
            success,
            message,
            details: results
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to process file. Please check the file format and try again.' 
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
