#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
  loadSchema,
  loadGoals,
  loadFoods,
  computeWeekly,
  computeFromBarcode,
  normalizeFromImporter,
  loadLimits,
  LifeStage,
  ReportJSON
} from 'nutri-core';
import {
  searchByName,
  lookupByBarcode,
  NormalizedFood
} from 'nutri-importers';
import {
  renderReportPdf,
  buildCitationsMap,
  getAppVersion
} from 'nutri-report-pdf';
import {
  createFilesystemShareService
} from 'nutri-share';

const program = new Command();

program
  .name('nutri')
  .description('Nutrition tracking CLI')
  .version('1.0.0');

program
  .command('report')
  .description('Generate weekly nutrition report')
  .requiredOption('--stage <stage>', 'Life stage (e.g., pregnancy_trimester2)')
  .requiredOption('--log <logPath>', 'Path to food log CSV')
  .requiredOption('--goals <goalsPath>', 'Path to goals YAML')
  .requiredOption('--schema <schemaPath>', 'Path to schema YAML')
  .requiredOption('--foods <foodsPath>', 'Path to foods CSV')
  .requiredOption('--out <outPath>', 'Output path for report JSON')
  .requiredOption('--limits <limitsPath>', 'Path to limits YAML')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧮 Generating nutrition report...'));

      // Validate file paths
      const requiredFiles = [
        { path: options.log, name: 'log' },
        { path: options.goals, name: 'goals' },
        { path: options.schema, name: 'schema' },
        { path: options.foods, name: 'foods' },
        { path: options.limits, name: 'limits' },
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(file.path)) {
          console.error(chalk.red(`❌ File not found: ${file.name} (${file.path})`));
          process.exit(1);
        }
      }

      // Load data
      const schema = loadSchema(options.schema);
      const goals = loadGoals(options.goals);
      const foodDB = loadFoods(options.foods, schema);
      const limits = loadLimits(options.limits);

      // Validate stage
      if (!goals[options.stage as LifeStage]) {
        console.error(chalk.red(`❌ Invalid stage: ${options.stage}`));
        console.log(chalk.yellow('Available stages:'), Object.keys(goals).join(', '));
        process.exit(1);
      }

      // Compute report
      const report = computeWeekly({
        logPath: options.log,
        stage: options.stage as LifeStage,
        foodDB,
        goals,
        schema,
        limits,
      });

      // Save report
      fs.writeFileSync(options.out, JSON.stringify(report, null, 2));
      console.log(chalk.green(`✅ Report saved to: ${options.out}`));

      // Print summary table
      printReportTable(report);

    } catch (error) {
      console.error(chalk.red('❌ Error generating report:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Scan a barcode and compute nutrition report')
  .requiredOption('--barcode <barcode>', 'Barcode (EAN/UPC)')
  .requiredOption('--stage <stage>', 'Life stage (e.g., pregnancy_trimester2)')
  .option('--goals <goalsPath>', 'Path to goals YAML (default: data/goals.yml)')
  .option('--schema <schemaPath>', 'Path to schema YAML (default: data/schema.yml)')
  .requiredOption('--limits <limitsPath>', 'Path to limits YAML')
  .option('--out <outPath>', 'Output path for report JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Scanning barcode...'));

      // Load schema, goals, and limits
      const schemaPath = options.schema || path.join(__dirname, '../../data/schema.yml');
      const goalsPath = options.goals || path.join(__dirname, '../../data/goals.yml');

      if (!fs.existsSync(schemaPath)) {
        console.error(chalk.red(`❌ Schema file not found: ${schemaPath}`));
        process.exit(1);
      }
      if (!fs.existsSync(goalsPath)) {
        console.error(chalk.red(`❌ Goals file not found: ${goalsPath}`));
        process.exit(1);
      }
      if (!fs.existsSync(options.limits)) {
        console.error(chalk.red(`❌ Limits file not found: ${options.limits}`));
        process.exit(1);
      }

      const schema = loadSchema(schemaPath);
      const goals = loadGoals(goalsPath);
      const limits = loadLimits(options.limits);

      // Validate stage
      if (!goals[options.stage as LifeStage]) {
        console.error(chalk.red(`❌ Invalid stage: ${options.stage}`));
        console.log(chalk.yellow('Available stages:'), Object.keys(goals).join(', '));
        process.exit(1);
      }

      // Look up by barcode
      const normalizedFood = await lookupByBarcode(options.barcode);

      if (!normalizedFood) {
        console.error(chalk.red(`❌ Food not found for barcode: ${options.barcode}`));
        process.exit(1);
      }

      console.log(chalk.green(`✅ Found: ${normalizedFood.food_name}`));
      if (normalizedFood.brand) {
        console.log(chalk.gray(`   Brand: ${normalizedFood.brand}`));
      }
      if (normalizedFood.barcode) {
        console.log(chalk.gray(`   Barcode: ${normalizedFood.barcode}`));
      }

      // Convert to FoodItem and compute report
      const foodItem = normalizeFromImporter(normalizedFood, schema);

      const report = await computeFromBarcode({
        barcode: options.barcode,
        stage: options.stage as LifeStage,
        goals,
        schema,
        limits,
        importers: { lookupByBarcode },
      });

      // Save report if output path specified
      if (options.out) {
        fs.writeFileSync(options.out, JSON.stringify(report, null, 2));
        console.log(chalk.green(`✅ Report saved to: ${options.out}`));
      }

      // Print summary table
      printReportTable(report);

    } catch (error) {
      console.error(chalk.red('❌ Error scanning barcode:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('find')
  .description('Search for foods by name')
  .requiredOption('--query <query>', 'Search query')
  .option('--limit <number>', 'Maximum results (default: 10)', '10')
  .option('--goals <goalsPath>', 'Path to goals YAML (default: data/goals.yml)')
  .option('--schema <schemaPath>', 'Path to schema YAML (default: data/schema.yml)')
  .action(async (options) => {
    try {
      console.log(chalk.blue(`🔍 Searching for: "${options.query}"`));

      // Load schema for normalization
      const schemaPath = options.schema || path.join(__dirname, '../../data/schema.yml');
      if (!fs.existsSync(schemaPath)) {
        console.error(chalk.red(`❌ Schema file not found: ${schemaPath}`));
        process.exit(1);
      }
      const schema = loadSchema(schemaPath);

      // Search for foods
      const results = await searchByName(options.query, {
        limit: parseInt(options.limit)
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No foods found.'));
        return;
      }

      console.log(chalk.green(`\n📋 Found ${results.length} foods:\n`));

      // Print results in a table format
      results.forEach((food, index) => {
        console.log(chalk.cyan(`${index + 1}. ${food.food_name}`));
        if (food.brand) {
          console.log(chalk.gray(`   Brand: ${food.brand}`));
        }
        if (food.barcode) {
          console.log(chalk.gray(`   Barcode: ${food.barcode}`));
        }
        console.log(chalk.gray(`   Source: ${food.source} (${food.source_id})`));

        // Show key nutrients that are present
        const presentNutrients = Object.entries(food.nutrients)
          .filter(([_, value]) => value > 0)
          .map(([key, value]) => `${key}: ${value.toFixed(1)}`)
          .slice(0, 3); // Show top 3

        if (presentNutrients.length > 0) {
          console.log(chalk.gray(`   Key nutrients: ${presentNutrients.join(', ')}`));
        }

        console.log();
      });

    } catch (error) {
      console.error(chalk.red('❌ Error searching:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('export-pdf')
  .description('Export nutrition report as PDF for clinicians')
  .requiredOption('--stage <stage>', 'Life stage (e.g., pregnancy_trimester2)')
  .requiredOption('--log <logPath>', 'Path to food log CSV')
  .requiredOption('--goals <goalsPath>', 'Path to goals YAML')
  .requiredOption('--schema <schemaPath>', 'Path to schema YAML')
  .requiredOption('--limits <limitsPath>', 'Path to limits YAML')
  .requiredOption('--week-start <weekStartISO>', 'Week start date in ISO format (YYYY-MM-DD)')
  .requiredOption('--out <outPath>', 'Output path for PDF file')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📄 Exporting PDF report...'));

      // Validate file paths
      const requiredFiles = [
        { path: options.log, name: 'log' },
        { path: options.goals, name: 'goals' },
        { path: options.schema, name: 'schema' },
        { path: options.limits, name: 'limits' },
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(file.path)) {
          console.error(chalk.red(`❌ File not found: ${file.name} (${file.path})`));
          process.exit(1);
        }
      }

      // Load data
      const schema = loadSchema(options.schema);
      const goals = loadGoals(options.goals);
      const limits = loadLimits(options.limits);

      // Validate stage
      if (!goals[options.stage as LifeStage]) {
        console.error(chalk.red(`❌ Invalid stage: ${options.stage}`));
        console.log(chalk.yellow('Available stages:'), Object.keys(goals).join(', '));
        process.exit(1);
      }

      // Create food database (simplified for PDF export)
      const foodDB: any = {}

      // For PDF export, we don't need full food data since we're just generating the report
      // The report will be computed with minimal food data

      // Compute report
      const report = computeWeekly({
        logPath: options.log,
        stage: options.stage as LifeStage,
        foodDB,
        goals,
        schema,
        limits,
      });

      // Build citations map
      const citations = buildCitationsMap(goals, limits);
      const appVersion = getAppVersion();

      // Generate PDF
      const pdfBuffer = await renderReportPdf(report, {
        stage: options.stage as LifeStage,
        goals,
        limits,
        weekStartISO: options.weekStart,
        sources: citations,
        appVersion,
      });

      // Write PDF to file
      fs.writeFileSync(options.out, pdfBuffer);

      console.log(chalk.green(`✅ PDF exported to: ${options.out}`));
      console.log(chalk.gray(`   Report includes: ${Object.keys(report.nutrients).length} nutrients`));
      console.log(chalk.gray(`   Citations: ${Object.keys(citations).length} sources referenced`));

    } catch (error) {
      console.error(chalk.red('❌ Error exporting PDF:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('share')
  .description('Create a secure share link for a nutrition report')
  .requiredOption('--stage <stage>', 'Life stage (e.g., pregnancy_trimester2)')
  .requiredOption('--log <logPath>', 'Path to food log CSV')
  .requiredOption('--goals <goalsPath>', 'Path to goals YAML')
  .requiredOption('--schema <schemaPath>', 'Path to schema YAML')
  .requiredOption('--limits <limitsPath>', 'Path to limits YAML')
  .requiredOption('--week-start <weekStartISO>', 'Week start date in ISO format (YYYY-MM-DD)')
  .option('--secret <secret>', 'HMAC secret (default: SHARE_SECRET env var)')
  .option('--output <outputPath>', 'Also write PDF to local file')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔗 Creating secure share link...'));

      // Validate file paths
      const requiredFiles = [
        { path: options.log, name: 'log' },
        { path: options.goals, name: 'goals' },
        { path: options.schema, name: 'schema' },
        { path: options.limits, name: 'limits' },
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(file.path)) {
          console.error(chalk.red(`❌ File not found: ${file.name} (${file.path})`));
          process.exit(1);
        }
      }

      // Load data
      const schema = loadSchema(options.schema);
      const goals = loadGoals(options.goals);
      const limits = loadLimits(options.limits);

      // Validate stage
      if (!goals[options.stage as LifeStage]) {
        console.error(chalk.red(`❌ Invalid stage: ${options.stage}`));
        console.log(chalk.yellow('Available stages:'), Object.keys(goals).join(', '));
        process.exit(1);
      }

      // Create food database (simplified for sharing)
      const foodDB: any = {}

      // For sharing, we don't need full food data since we're just generating the report
      // The report will be computed with minimal food data

      // Compute report
      const report = computeWeekly({
        logPath: options.log,
        stage: options.stage as LifeStage,
        foodDB,
        goals,
        schema,
        limits,
      });

      // Build citations map
      const citations = buildCitationsMap(goals, limits);
      const appVersion = getAppVersion();

      // Generate PDF
      const pdfBuffer = await renderReportPdf(report, {
        stage: options.stage as LifeStage,
        goals,
        limits,
        weekStartISO: options.weekStart,
        sources: citations,
        appVersion,
      });

      // Create share service
      const secret = options.secret || process.env.SHARE_SECRET || 'development-secret';
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const shareService = createFilesystemShareService(secret, `${baseUrl}/share`);

      // Create share link
      const shareResult = await shareService.createLink({
        pdfBytes: pdfBuffer,
        stage: options.stage as LifeStage,
        weekStartISO: options.weekStart,
        reportMeta: { version: appVersion },
      });

      // Output results
      console.log(chalk.green(`✅ Share link created: ${shareResult.url}`));
      console.log(chalk.gray(`   ID: ${shareResult.id}`));
      console.log(chalk.gray(`   Expires: ${shareResult.expiresAtISO}`));

      // Optional: write PDF to local file
      if (options.output) {
        fs.writeFileSync(options.output, pdfBuffer);
        console.log(chalk.green(`✅ PDF also saved to: ${options.output}`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error creating share link:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printReportTable(report: ReportJSON) {
  console.log(chalk.cyan('\n📊 Weekly Nutrition Report'));
  console.log(chalk.gray(`Week: ${report.week_start} to ${report.week_end}`));
  console.log(chalk.gray(`Stage: ${report.stage}`));

  console.log(chalk.yellow('\nNutrient Status:'));

  // Header
  console.log(chalk.cyan('Nutrient'.padEnd(15) + 'Total'.padEnd(10) + 'Goal'.padEnd(10) + '% Target'.padEnd(10) + 'Status'.padEnd(12) + 'Source'));

  // Rows
  Object.entries(report.nutrients).forEach(([nutrient, data]) => {
    const provenance = report.provenance[nutrient];
    const ulAlert = report.ulAlerts[nutrient];

    // Status with UL indicators
    let status = '';
    if (ulAlert?.severity === 'error') {
      status = chalk.red('✕ EXCEEDED UL');
    } else if (ulAlert?.severity === 'warn') {
      status = chalk.yellow('! NEAR UL');
    } else if (data.gap_surplus < 0) {
      status = chalk.red('DEFICIT');
    } else if (data.gap_surplus > 0) {
      status = chalk.green('SURPLUS');
    } else {
      status = chalk.yellow('ON TRACK');
    }

    // Percent target color
    const percentColor = data.percent_target < 90
      ? chalk.red
      : data.percent_target < 100
        ? chalk.yellow
        : chalk.green;

    // Confidence indicator
    const confidence = report.confidence[nutrient] || 0;
    const confidenceColor = confidence > 0.8
      ? chalk.green
      : confidence > 0.6
        ? chalk.yellow
        : chalk.red;

    console.log(
      nutrient.padEnd(15) +
      data.weekly_total.toFixed(1).padEnd(10) +
      data.weekly_goal.toFixed(1).padEnd(10) +
      percentColor(data.percent_target.toString()).padEnd(10) +
      status.padEnd(12) +
      `${confidenceColor(provenance)} ${confidenceColor(`(${confidence.toFixed(2)})`)}`
    );
  });

  // Summary
  console.log(chalk.yellow('\nSummary:'));
  if (report.summary.ul_exceeded.length > 0) {
    console.log(chalk.red(`⚠️  UL Exceeded: ${report.summary.ul_exceeded.join(', ')}`));
  }
  if (report.summary.ul_warnings.length > 0) {
    console.log(chalk.yellow(`! Near UL: ${report.summary.ul_warnings.join(', ')}`));
  }
  if (report.summary.deficient_nutrients.length > 0) {
    console.log(chalk.red(`Deficient: ${report.summary.deficient_nutrients.join(', ')}`));
  }
  if (report.summary.surplus_nutrients.length > 0) {
    console.log(chalk.green(`Surplus: ${report.summary.surplus_nutrients.join(', ')}`));
  }
  if (report.summary.ul_exceeded.length === 0 && report.summary.ul_warnings.length === 0 &&
      report.summary.deficient_nutrients.length === 0 && report.summary.surplus_nutrients.length === 0) {
    console.log(chalk.green('All nutrients on track! 🎉'));
  }

  // Show provenance flags
  if (report.flags.length > 0) {
    console.log(chalk.yellow('\nData Quality Notes:'));
    const uniqueFlags = [...new Set(report.flags)];
    uniqueFlags.forEach(flag => {
      console.log(chalk.gray(`  • ${flag}`));
    });
  }
}

program.parse();
