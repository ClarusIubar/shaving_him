/**
 * TSK-009-01: BrushController's radius clamp must match what the UI offers.
 * index.html's largest brush button (data-radius="7", "15x15") and the
 * keyboard shortcut '4' (KEY_BRUSH_RADIUS_MAP['4'] = 7) both request radius
 * 7; setRadius() must actually apply it instead of silently downgrading to 5.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { BrushController } from '../../src/ui/brush-controller.js';

test('BrushController - setRadius honours the full 1-7 range the UI exposes', () => {
    const controller = new BrushController(null, null, () => {});

    assert.equal(controller.setRadius(7) ?? controller.brushRadius, controller.brushRadius);
    controller.setRadius(7);
    assert.equal(controller.brushRadius, 7, '"15x15" button / keyboard 4 must apply radius 7, not clamp to 5');

    controller.setRadius(0);
    assert.equal(controller.brushRadius, 1, 'lower bound stays at 1');

    controller.setRadius(99);
    assert.equal(controller.brushRadius, 7, 'upper bound stays at 7, not unbounded');
});

test('BrushController - mouse wheel can reach radius 7 through successive increases', () => {
    const controller = new BrushController(null, null, () => {});
    controller.setRadius(5);
    controller.setRadius(controller.brushRadius + 1);
    controller.setRadius(controller.brushRadius + 1);
    assert.equal(controller.brushRadius, 7, 'wheel-driven increases must be able to reach the UI-exposed maximum');
});
