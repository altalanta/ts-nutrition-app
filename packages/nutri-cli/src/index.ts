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
  LifeStage,
  ReportJSON
} from 'nutri-core';

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
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧮 Generating nutrition report...'));

      // Validate file paths
      const requiredFiles = [
        { path: options.log, name: 'log' },
        { path: options.goals, name: 'goals' },
        { path: options.schema, name: 'schema' },
        { path: options.foods, name: 'foods' },
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

function printReportTable(report: ReportJSON) {
  console.log(chalk.cyan('\n📊 Weekly Nutrition Report'));
  console.log(chalk.gray(`Week: ${report.week_start} to ${report.week_end}`));
  console.log(chalk.gray(`Stage: ${report.stage}`));

  console.log(chalk.yellow('\nNutrient Status:'));

  // Header
  console.log(chalk.cyan('Nutrient'.padEnd(15) + 'Total'.padEnd(10) + 'Goal'.padEnd(10) + '% Target'.padEnd(10) + 'Status'));

  // Rows
  Object.entries(report.nutrients).forEach(([nutrient, data]) => {
    const status = data.gap_surplus < 0
      ? chalk.red('DEFICIT')
      : data.gap_surplus > 0
        ? chalk.green('SURPLUS')
        : chalk.yellow('ON TRACK');

    const percentColor = data.percent_target < 90
      ? chalk.red
      : data.percent_target < 100
        ? chalk.yellow
        : chalk.green;

    console.log(
      nutrient.padEnd(15) +
      data.weekly_total.toFixed(1).padEnd(10) +
      data.weekly_goal.toFixed(1).padEnd(10) +
      percentColor(data.percent_target.toString()).padEnd(10) +
      status
    );
  });

  // Summary
  console.log(chalk.yellow('\nSummary:'));
  if (report.summary.deficient_nutrients.length > 0) {
    console.log(chalk.red(`Deficient: ${report.summary.deficient_nutrients.join(', ')}`));
  }
  if (report.summary.surplus_nutrients.length > 0) {
    console.log(chalk.green(`Surplus: ${report.summary.surplus_nutrients.join(', ')}`));
  }
  if (report.summary.deficient_nutrients.length === 0 && report.summary.surplus_nutrients.length === 0) {
    console.log(chalk.green('All nutrients on track! 🎉'));
  }
}

program.parse();
