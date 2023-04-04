import { Tokenizer } from "../tokenizer";

const str = "this should #|    #|    #| #| |  | | | | | | | # | # | #  |# be evaluated"

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

console.log(tok);
