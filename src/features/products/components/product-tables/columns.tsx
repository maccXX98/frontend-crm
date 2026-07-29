'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ProductEntity } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

export const columns: ColumnDef<ProductEntity>[] = [
  {
    id: 'Image',
    accessorKey: 'Image',
    header: 'IMAGE',
    cell: ({ row }) => {
      const product = row.original;
      let imageUrl = product.Image;
      if (product.productImages && product.productImages.length > 0) {
        const img = product.productImages[0];
        imageUrl = img.webPath || img.thumbPath || img.originalPath || imageUrl;
      }
      const name = product.Name;

      if (imageUrl) {
        let fullUrl = imageUrl;
        // Backend stores uploads under /uploads/* and Fastify serves them at http://localhost:3000.
        // webPath comes as "products/web/xxx.webp" (no leading slash, no "uploads/" prefix).
        // Construct the absolute URL so the <img> can fetch it.
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          const path = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
          fullUrl = `http://localhost:3000/uploads/${path}`;
        }
        if (isValidImageUrl(fullUrl)) {
          return (
            <div className='relative h-10 w-10 overflow-hidden rounded-lg'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUrl}
                alt={name}
                className='h-full w-full object-cover'
              />
            </div>
          );
        }
      }

      return (
        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
          <Icons.media className='h-5 w-5 text-muted-foreground' />
        </div>
      );
    },
  },
  {
    id: 'Name',
    accessorKey: 'Name',
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ProductEntity['Name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search products...',
      variant: 'text',
      icon: Icons.text,
    },
    enableColumnFilter: true,
  },
  {
    id: 'NickName',
    accessorKey: 'NickName',
    header: 'NICKNAME',
    cell: ({ row }) => <div className='text-muted-foreground'>{row.getValue('NickName') || '-'}</div>,
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    enableSorting: false,
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Categories' />
    ),
    cell: ({ cell }) => {
      const categories = cell.getValue<ProductEntity['categories']>();
      if (!categories || categories.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {categories.slice(0, 2).map((cat) => (
            <Badge key={cat.CategoryID} variant='outline' className='capitalize'>
              {cat.Name}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant='outline'>+{categories.length - 2}</Badge>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'categories',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS,
    },
  },
  {
    id: 'distributor',
    accessorKey: 'distributor',
    header: 'DISTRIBUTOR',
    cell: ({ row }) => {
      const distributor = row.getValue('distributor') as ProductEntity['distributor'];
      return distributor ? (
        <Badge variant='outline'>{distributor.Name}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    },
  },
  {
    id: 'sellingPrice',
    header: 'PRICE',
    cell: ({ row }) => {
      // Access from row.original since productPrices is a nested relation
      const product = row.original;
      const prices = product.productPrices;
      if (!prices || prices.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }
      const latestPrice = prices[0];
      const currency = latestPrice.Currency || 'USD';
      return (
        <span>
          {currency} {Number(latestPrice.SellingPrice).toFixed(2)}
        </span>
      );
    },
  },
  {
    id: 'Description',
    accessorKey: 'Description',
    header: 'DESCRIPTION',
    cell: ({ row }) => {
      const desc = row.getValue('Description') as string;
      return (
        <div className='max-w-[200px] truncate text-muted-foreground'>
          {desc || '-'}
        </div>
      );
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ProductEntity['createdAt']>();
      return date ? new Date(date).toLocaleDateString() : '-';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
