import {describe,it,expect} from 'vitest';
import {chatPermalink} from '../../../react/components/ui/buttons/ThreadMenuButton';
describe('copy link to a local chat',()=>{
    it('uses the private protocol namespace and preserves a normal thread identifier',()=>{
        expect(chatPermalink('abc-123')).toBe('zotero://astermargin/thread/abc-123');
    });
    it('keeps a supplied identifier inside one path segment',()=>{
        expect(chatPermalink('abc/123?#')).toBe('zotero://astermargin/thread/abc%2F123%3F%23');
    });
});
