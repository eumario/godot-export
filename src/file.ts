import { BuildResult } from './types/GodotExport';
import path from 'path';
import * as io from '@actions/io';
import { exec } from '@actions/exec';
import * as fs from 'fs';
import { GODOT_WORKING_PATH, RELATIVE_EXPORT_PATH } from './constants';
import * as core from '@actions/core';

async function zipBuildResults(buildResults: BuildResult[]): Promise<void> {
  core.startGroup('Zipping binaries');
  const promises: Promise<void>[] = [];
  for (const buildResult of buildResults) {
    promises.push(zipBuildResult(buildResult));
  }
  await Promise.all(promises);
  core.endGroup();
}

async function zipBuildResult(buildResult: BuildResult): Promise<void> {
  const distPath = path.join(GODOT_WORKING_PATH, 'dist');
  await io.mkdirP(distPath);

  const zipPath = path.join(distPath, `${buildResult.sanitizedName}.zip`);

  // mac exports a zip by default, so just move the file
  if (buildResult.preset.platform.toLowerCase() === 'mac osx') {
    const baseName = path.basename(buildResult.preset.export_path);
    const macPath = path.join(buildResult.directory, baseName);
    await exec('mv', [macPath, zipPath]);
  } else if (!fs.existsSync(zipPath)) {
    await exec('7z', ['a', zipPath, `${buildResult.directory}/*`]);
  }

  buildResult.archivePath = zipPath;
}

async function moveBuildsToExportDirectory(buildResults: BuildResult[], moveArchived?: boolean): Promise<void> {
  const fullExportPath = path.resolve(RELATIVE_EXPORT_PATH);
  await io.mkdirP(fullExportPath);

  const promises: Promise<void>[] = [];
  for (const buildResult of buildResults) {
    let promise: Promise<void>;
    if (moveArchived) {
      if (!buildResult.archivePath) {
        core.warning('Attempted to move export output that was not archived. Skipping');
        continue;
      }
      const newArchivePath = path.join(fullExportPath, path.basename(buildResult.archivePath));
      promise = io.mv(buildResult.archivePath, newArchivePath);
      buildResult.archivePath = newArchivePath;
    } else {
      promise = io.mv(buildResult.directory, fullExportPath);
      buildResult.directory = path.join(fullExportPath, path.basename(buildResult.directory));
    }

    promises.push(promise);
  }

  await Promise.all(promises);
}

export { zipBuildResults, moveBuildsToExportDirectory };
