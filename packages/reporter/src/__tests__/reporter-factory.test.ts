import { describe, it, expect } from "vitest";
import { 
	createConsoleReporter, 
	createJSONReporter, 
	createSummaryReporter,
	ConsoleReporter,
	JSONReporter,
	SummaryReporter
} from "../reporters/reporter.js";

describe("Reporter Factory Functions", () => {
	describe("createConsoleReporter", () => {
		it("should create a ConsoleReporter instance", () => {
			const reporter = createConsoleReporter();
			expect(reporter).toBeInstanceOf(ConsoleReporter);
		});

		it("should pass options to ConsoleReporter", () => {
			const options = { verbose: true, showTimings: false };
			const reporter = createConsoleReporter(options);
			expect(reporter).toBeInstanceOf(ConsoleReporter);
		});

		it("should work with empty options", () => {
			const reporter = createConsoleReporter({});
			expect(reporter).toBeInstanceOf(ConsoleReporter);
		});
	});

	describe("createJSONReporter", () => {
		it("should create a JSONReporter instance", () => {
			const reporter = createJSONReporter();
			expect(reporter).toBeInstanceOf(JSONReporter);
		});

		it("should pass options to JSONReporter", () => {
			const options = { verbose: true, showBody: true };
			const reporter = createJSONReporter(options);
			expect(reporter).toBeInstanceOf(JSONReporter);
		});

		it("should work with empty options", () => {
			const reporter = createJSONReporter({});
			expect(reporter).toBeInstanceOf(JSONReporter);
		});
	});

	describe("createSummaryReporter", () => {
		it("should create a SummaryReporter instance", () => {
			const reporter = createSummaryReporter();
			expect(reporter).toBeInstanceOf(SummaryReporter);
		});

		it("should pass options to SummaryReporter", () => {
			const options = { verbose: false, showTimings: true };
			const reporter = createSummaryReporter(options);
			expect(reporter).toBeInstanceOf(SummaryReporter);
		});

		it("should work with empty options", () => {
			const reporter = createSummaryReporter({});
			expect(reporter).toBeInstanceOf(SummaryReporter);
		});
	});
});