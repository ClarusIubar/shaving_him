/**
 * Application Layer: Composition Root
 * Centralized Dependency Injection container (DIP compliance).
 * Instantiates concrete Ports/Adapters and injects them into application services.
 */
import { StaticJsonStageAdapter } from '../adapters/static-json-stage.js';
import { CanvasImageProcessorAdapter } from '../adapters/canvas-image-processor.js';
import { DeltaDiffEngineAdapter } from '../adapters/delta-diff-engine.js';
import { CanvasAsciiConverterAdapter } from '../adapters/canvas-ascii-converter.js';
import { StagePipeline } from './stage-pipeline.js';
import { GameOrchestrator } from './game-orchestrator.js';

export const createCompositionRoot = (customAdapters = {}) => {
    const jsonAdapter = customAdapters.jsonAdapter || new StaticJsonStageAdapter();
    const imageProcessor = customAdapters.imageProcessor || new CanvasImageProcessorAdapter();
    const diffEngine = customAdapters.diffEngine || new DeltaDiffEngineAdapter();
    const asciiConverter = customAdapters.asciiConverter || new CanvasAsciiConverterAdapter();

    const stagePipeline = new StagePipeline(jsonAdapter, imageProcessor, diffEngine, asciiConverter);
    const orchestrator = new GameOrchestrator(stagePipeline);

    return {
        jsonAdapter,
        imageProcessor,
        diffEngine,
        asciiConverter,
        stagePipeline,
        orchestrator
    };
};
