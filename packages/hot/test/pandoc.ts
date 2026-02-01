export const detectPandoc = async (): Promise<boolean> => {
  try {
    const proc = Bun.spawn(["pandoc", "--version"], {
      stderr: "ignore",
      stdout: "ignore",
    });
    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch (error) {
    return false;
  }
};

export const warnPandocMissing = (context: string) => {
  console.warn(`Pandoc not found. Skipping ${context} tests.`);
};
