import { window } from 'vscode';
import { MenuItem } from '../menu/menuItem';
import { MagitRepository } from '../models/magitRepository';
import { MenuUtil, MenuState, Switch } from '../menu/menu';
import { gitRun } from '../utils/gitRawRunner';
import { QuickItem, QuickMenuUtil } from '../menu/quickMenu';

export async function fetching(repository: MagitRepository): Promise<any> {

  const fetchingMenuItems: MenuItem[] = [];

  if (repository.magitState?.HEAD?.pushRemote) {
    const pushRemote = repository.magitState?.HEAD?.pushRemote;
    fetchingMenuItems.push({ label: 'p', description: pushRemote.remote, action: fetchFromPushRemote });
  }

  if (repository.magitState?.HEAD?.upstream) {
    const upstream = repository.magitState?.HEAD?.upstream;
    fetchingMenuItems.push({ label: 'u', description: upstream.remote, action: fetchFromUpstream });
  }

  fetchingMenuItems.push({ label: 'e', description: 'elsewhere', action: fetchFromElsewhere });

  fetchingMenuItems.push({ label: 'a', description: 'all remotes', action: fetchAll });

  fetchingMenuItems.push({ label: 'o', description: 'another branch', action: fetchAnotherBranch });

  const switches: Switch[] = [
    { shortName: '-p', longName: '--prune', description: 'Prune deleted branches' }
  ];

  return MenuUtil.showMenu({ title: 'Fetching', commands: fetchingMenuItems }, { repository, switches });
}

async function fetchFromPushRemote({ repository, switches }: MenuState) {
  if (repository.magitState?.HEAD?.pushRemote) {
    const args = ['fetch', ...MenuUtil.switchesToArgs(switches), repository.magitState.HEAD.pushRemote.remote];
    return gitRun(repository, args);
  }
}

async function fetchFromUpstream({ repository, switches }: MenuState) {

  if (repository.magitState?.HEAD?.upstreamRemote) {
    const args = ['fetch', ...MenuUtil.switchesToArgs(switches), repository.magitState.HEAD.upstreamRemote.remote];
    return gitRun(repository, args);
  }
}

async function fetchFromElsewhere({ repository, switches }: MenuState) {

  const remotes: QuickItem<string>[] = repository.state.remotes
    .map(r => ({ label: r.name, description: r.pushUrl, meta: r.name }));

  const chosenRemote = await QuickMenuUtil.showMenu(remotes);

  if (chosenRemote) {
    const args = ['fetch', ...MenuUtil.switchesToArgs(switches), chosenRemote];
    return gitRun(repository, args);
  }
}

async function fetchAll({ repository, switches }: MenuState) {
  const args = ['fetch', ...MenuUtil.switchesToArgs(switches), '--all'];
  return gitRun(repository, args);
}

async function fetchAnotherBranch({ repository, switches }: MenuState) {
  const remote = await window.showInputBox({ prompt: 'Fetch from remote or url' });
  if (remote) {
    const branch = await window.showInputBox({ prompt: 'Fetch branch' });
    if (branch) {
      const args = ['fetch', ...MenuUtil.switchesToArgs(switches), remote, `refs/heads/${branch}`];
      return gitRun(repository, args);
    }
  }
}