// __tests__/fsm.test.ts
import { isValidTransition } from "../src/lib/fsm_logic";

describe("Finite State Machine (FSM) Logic", () => {

    test("should allow valid progression: LEAD -> SCHEDULED", () => {
        const result = isValidTransition('LEAD_RECEIVED', 'SCHEDULED');
        expect(result).toBe(true);
    });

    test("should allow valid progression: SCHEDULED -> INVOICED", () => {
        const result = isValidTransition('SCHEDULED', 'INVOICED');
        expect(result).toBe(true);
    });

    test("should BLOCK illegal jump: LEAD -> PAID", () => {
        const result = isValidTransition('LEAD_RECEIVED', 'PAID');
        expect(result).toBe(false); // Should fail
    });

    test("should BLOCK illegal jump: INVOICED -> LOST", () => {
        const result = isValidTransition('INVOICED', 'LOST');
        expect(result).toBe(false); // Should fail
    });

    test("should allow Admin Override to SCHEDULED from anywhere", () => {
        const result = isValidTransition('CANCELLED', 'SCHEDULED');
        expect(result).toBe(true);
    });

});