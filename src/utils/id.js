import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export function newId(prefix = "") {
  const id = uuidv4();
  return prefix ? `${prefix}_${id}` : id;
}
