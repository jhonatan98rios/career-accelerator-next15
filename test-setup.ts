// Mobile / ARM workaround: vitest's native esbuild binary can crash
// with SIGILL on Termux/Android ARM64. This setup lets you run tests
// via Node's built-in test runner instead.
//
// Usage:
//   node --import tsx --require ./test-setup.ts --test 'src/**/*.test.ts'
//
// On desktop/CI, use the regular: npm test
import { expect as chaiExpect, use } from "chai";
import { JestChaiExpect } from "@vitest/expect";

use(JestChaiExpect);
(globalThis as any).expect = chaiExpect;
