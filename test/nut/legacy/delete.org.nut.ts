/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { assert, expect } from 'chai';
import { DeleteResult } from '../../../src/commands/force/org/delete';

// these NUTs are separated from org.nuts.ts because deleting orgs may interfere with the other NUTs
describe('Delete Orgs', () => {
  let session: TestSession;
  let defaultUsername: string;
  let aliasedUsername: string;
  let defaultUserOrgId: string;
  let aliasUserOrgId: string;

  // create our own orgs to delete to avoid interfering with other NUTs/cleanup
  before(async () => {
    session = await TestSession.create({
      project: { name: 'legacyOrgDelete' },
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          setDefault: true,
          config: join('config', 'project-scratch-def.json'),
        },
        {
          alias: 'deleteAlias',
          config: join('config', 'project-scratch-def.json'),
        },
      ],
    });

    const defaultOrg = session.orgs.get('default');
    const aliasOrg = session.orgs.get('deleteAlias');

    assert(defaultOrg?.username);
    assert(defaultOrg?.orgId);
    assert(aliasOrg?.username);
    assert(aliasOrg?.orgId);

    defaultUsername = defaultOrg.username;
    defaultUserOrgId = defaultOrg.orgId;

    aliasedUsername = aliasOrg?.username;
    aliasUserOrgId = aliasOrg?.orgId;
  });

  after(async () => {
    try {
      await session?.clean();
    } catch (e) {
      // do nothing, session?.clean() will try to remove files already removed by the org:delete and throw an error
      // it will also unwrap other stubbed methods
    }
  });

  it('delete scratch orgs via config', () => {
    const result = execCmd('force:org:delete --noprompt --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    expect(result).to.be.ok;
    expect(result).to.deep.equal({ orgId: defaultUserOrgId, username: defaultUsername });
  });

  it('delete scratch orgs via alias', () => {
    const result = execCmd<DeleteResult>('force:org:delete --targetusername deleteAlias --noprompt --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    expect(result).to.be.ok;
    expect(result).to.deep.equal({ orgId: aliasUserOrgId, username: aliasedUsername });
  });

  describe.skip('sandbox', () => {
    // TODO: figure out how to test sandboxes in NUTs
  });
});
