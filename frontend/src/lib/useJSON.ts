import { fileLoc, getFileJSON } from "lib/net";
import { NotFound } from "core/types";
import { useEffect, useState } from "react";

export function useJSON<T>(
  userId: string | undefined,
  filename: string,
  initial: T,
): [T | undefined | NotFound, (newData: T | NotFound) => void] {
  const [data, setData] = useState<T | NotFound>(initial);

  useEffect(() => {
    if (userId !== undefined) {
      const location = fileLoc(userId, filename);
      getFileJSON<T>(location)
        .then((d) => {
          if (d) {
            setData(d);
          }
        });
    }
  }, [userId, filename]);

  return [data, setData];
}
