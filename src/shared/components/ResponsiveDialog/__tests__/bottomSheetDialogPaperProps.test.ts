import { describe, expect, it } from 'vitest';

import { getBottomSheetPaperProps } from '../bottomSheetDialogPaperProps';

describe('getBottomSheetPaperProps', () => {
  it('pins the paper to the bottom, full-width, top-corners-only when mobile', () => {
    const props = getBottomSheetPaperProps(true);

    expect(props.sx).toMatchObject({
      position: 'fixed',
      bottom: 0,
      width: '100%',
      borderRadius: 0,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    });
  });

  it('reverts to the default centered dialog paper at md+', () => {
    const props = getBottomSheetPaperProps(false);

    expect(props.sx).toEqual({});
  });
});
