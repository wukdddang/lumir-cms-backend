import { CreateFolderHandler } from './commands/create-folder.handler';
import { CreateFileHandler } from './commands/create-file.handler';
import { UpdateWikiHandler } from './commands/update-wiki.handler';
import { UpdateWikiFileHandler } from './commands/update-wiki-file.handler';
import { UpdateWikiPublicHandler } from './commands/update-wiki-public.handler';
import { UpdateWikiPathHandler } from './commands/update-wiki-path.handler';
import { DeleteWikiHandler } from './commands/delete-wiki.handler';
import { DeleteFolderOnlyHandler } from './commands/delete-folder-only.handler';
import { GetWikiDetailHandler } from './queries/get-wiki-detail.handler';
import { GetFolderChildrenHandler } from './queries/get-folder-children.handler';
import { GetFolderStructureHandler } from './queries/get-folder-structure.handler';
import { GetWikiBreadcrumbHandler } from './queries/get-wiki-breadcrumb.handler';
import { SearchWikiHandler } from './queries/search-wiki.handler';
import { GetFolderByPathHandler } from './queries/get-folder-by-path.handler';

export const WikiCommandHandlers = [
  CreateFolderHandler,
  CreateFileHandler,
  UpdateWikiHandler,
  UpdateWikiFileHandler,
  UpdateWikiPublicHandler,
  UpdateWikiPathHandler,
  DeleteWikiHandler,
  DeleteFolderOnlyHandler,
];

export const WikiQueryHandlers = [
  GetWikiDetailHandler,
  GetFolderChildrenHandler,
  GetFolderStructureHandler,
  GetWikiBreadcrumbHandler,
  SearchWikiHandler,
  GetFolderByPathHandler,
];

export const WikiHandlers = [...WikiCommandHandlers, ...WikiQueryHandlers];
