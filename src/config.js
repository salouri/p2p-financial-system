export const COMMON_TOPIC = Buffer.alloc(32).fill('decentrapay');
/**
 * Provides encoding and decoding utilities for string values.
 *
 * The `preencode` function calculates the expected length of the encoded value.
 * The `encode` function writes the string value to the provided buffer.
 * The `decode` function reads the string value from the provided buffer.
 */
export const VALUE_ENCODING = {
  preencode(state, value) {
    // state is a reference to the current encoding state: {buffer, end}
    // where end is the offset of the next byte to write to the buffer
    if (typeof value === 'string') {
      state.end += Buffer.byteLength(value);
    } else {
      throw new TypeError('Expected value to be a string');
    }
  },
  encode(state, value) {
    if (typeof value === 'string') {
      state.buffer.write(value);
    } else {
      throw new TypeError('Expected value to be a string');
    }
  },
  decode(state) {
    return state.buffer.toString();
  },
};
