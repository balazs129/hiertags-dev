# This is a perl program
# usage: 
# perl reconstr_A.pl [arguments]
# for possible arguments run the program without arguments
# more info about perl: www.perl.org


use strict;
use warnings;
use POSIX;

my ($label, $label2, $label3, $i, $j, $k, $fout, $parent, $flag, $O, $current, $next, $exact, $lineage, $near, $mu, $sigma, $sum, $sum2, $threshold, $max_w, $max_z, $max_d, $c, $all, $inverted, $differentbranches, $use_origDAG, $use_annots, $annots_file, $use_coappearances, $coapps_file, $objn_file, $dag_file, $comment, $def_threshold, $help_msg);
my (@temp, @currents, @temp2);
my (%ll_nb, %nb, %child, %parent, %centrality, %strength, %objectnumber, %temp, %nexts, %visited, %score, %ancestors, %siblings, %zscore, %temp2, %ll_nb_filtered, %descendantsvotes, %child_reconstr);


$threshold = 10;       # default value
$comment = '#';        # comment line indicator
$help_msg = "\nusage:\n\nperl reconstr_B.pl [arguments]\n\nmandatory arguments:\n\t-tags OBJECTS_WITH_TAGS_FILE (mutually exclusive with -net)\n\t-net  WEIGHTED_TAG_COAPPEARANCES_FILE (mutually exclusive with -tags)\n\t-objn OBJECTNUMBERS_FILE (only when using -net)\n\noptional arguments:\n\t-dag ORIGINAL_DAG_FILE\n\t-z   Z-SCORE_THRESHOLD_VAUE (a nonnegative real number; default is 10)\n\t-o   OUTPUT_FILE\n\ncomment lines in the input files should begin with # (whitespaces before the # are allowed)\n\nexamples:\nperl reconstr_B.pl -tags tagged_objects_file.txt\nperl reconstr_B.pl -net tag_coappearances.txt -objn objectnumbers.txt -o output.txt -z 8.67 -dag dag_file.txt\n\n";

if (not @ARGV or @ARGV == 1 and ($ARGV[0] eq '-h' or $ARGV[0] eq '-help' or $ARGV[0] eq '--help')){
	die $help_msg;
}
for ($i = 0; $i < @ARGV; $i += 2){
	die $help_msg unless $ARGV[$i] =~ /^-/;
#	die "$ARGV[$i] requires a switch (e.g. -o)!\n" unless $ARGV[$i] =~ /^-/;
	die $help_msg if $i + 1 >= @ARGV or $ARGV[$i+1] =~ /^-/;
#	die "missing input after switch $ARGV[$i]!\n" if $i + 1 >= @ARGV or $ARGV[$i+1] =~ /^-/;
	$_ = $ARGV[$i + 1];
	die $help_msg unless $ARGV[$i] =~ /^-/;
#	die "missing switch before $_!\n" unless $ARGV[$i] =~ /^-/;
	if ($ARGV[$i] eq '-tags'){
		$use_annots = 1;
		$annots_file = $ARGV[$i + 1];
		die $help_msg if $use_coappearances;
#		die "use either -tags or -net!\n" if $use_coappearances;
	}
	elsif ($ARGV[$i] eq '-net'){
		$use_coappearances = 1;
		$coapps_file = $ARGV[$i + 1];
		die $help_msg if $use_annots;
#		die "use either -tags or -net!\n" if $use_annots;
	}
	elsif ($ARGV[$i] eq '-objn'){
		$objn_file = $ARGV[$i + 1];
		die $help_msg unless $use_coappearances;
#		die "objectnumbers are unnecessary when using -tags. Please use the -net switch with a coappearance graph input or exclude $objn_file!\n" unless $use_coappearances;
                open IN, $objn_file or die "unable to open $objn_file: $!\n";
                ($j, $k, $flag) = (0, 0, 0);
                while (<IN>){
         		if (/^\s*$comment/ or /^\s*\n/){
          		}
          		elsif (/^(\d+)\n/){
        			if ( $j != 0 and $k == 0){
                                        print STDERR "in $objn_file, first line (excluding comments and empty lines) should be a single positive integer number, the total number of objects!\n";
                                        $flag = 1;
                                }
                                unless ($k == 0){
                                        print STDERR "in $objn_file, a single number is expected only in the first (nonempty, noncomment) line!\n";
                                        $flag = 1;
                                }
                                $k++;
          		}
        		elsif (/^(\S+)\s(\d+)\n/){
         			$j++;
          		}
          		else {
         			print STDERR "invalid line in $objn_file:\n$_";
          			$flag = 1;
          		}
                }
                close IN;
                if ($j == 0){
                        print STDERR "in $objn_file, the number of objects of each tag is expected!\nformat of a line: 'tag number_of_objects'\n";
                        $flag = 1;
                }
                die if $flag;
	}
	elsif ($ARGV[$i] eq '-z'){
		$def_threshold = 1;
		$threshold = $ARGV[$i + 1];
		die $help_msg unless $threshold =~ /^\d+(\.\d+)?$/;
#		die "$threshold is not a valid z-score threshold!\n" unless $threshold =~ /^\d+(\.\d+)?$/;
	}
	elsif ($ARGV[$i] eq '-dag'){
		$use_origDAG = 1;
		$dag_file = $ARGV[$i + 1];
	}
	elsif ($ARGV[$i] eq '-o'){
		$fout = $ARGV[$i + 1];
	}
	else {
		die $help_msg;
#		die "unknown input parameter: $ARGV[$i]!\ntype perl reconstr_flickr_simple_B.pl for help!\n";
	}
}
die $help_msg unless $use_annots or $use_coappearances;
#die "please use either -tags or -net!\n" unless $use_annots or $use_coappearances;
die $help_msg if $use_coappearances and not $objn_file;
#die "please give an objectnumbers file when using -net!\n" if $use_coappearances and not $objn_file;

print STDERR "\ninput:\n";
print STDERR "tagged objects: $annots_file\n" if $use_annots;
print STDERR "weighted coappearance graph: $coapps_file\nobjectnumbers: $objn_file\n" if $use_coappearances;
print STDERR "z-score threshold = $threshold\n";
print STDERR "original DAG: $dag_file\n" if $use_origDAG;
print STDERR "\n";



	# input

if ($use_origDAG){
	open IN, $dag_file or die "unable to open $dag_file: $!\n";
	$flag = 0;
	while(<IN>){
		if (/^\s*$comment/ or /^\s*\n/){
		}
		elsif (/^(\S+)\s(\S+)\n/){	# DAG in "child parent" edgelist format
			$parent{$1}{$2} = undef;
			$child{$2}{$1} = undef;
		
			$nb{$1}{$2} = undef;
			$nb{$2}{$1} = undef;
		}
		else {
			print STDERR "invalid line in $dag_file:\n$_";
			$flag = 1;
		}
	}
	close IN;
	die if $flag;
}


if ($use_coappearances){
	open IN, "$coapps_file" or die "unable to open $coapps_file: $!\n";
	$flag = 0;
	while (<IN>){
		if (/^\s*$comment/ or /^\s*\n/){
		}
		elsif (/^(\S+)\s(\S+)\s(\d+)\n/){
			$ll_nb{$1}{$2} = $3;
			$ll_nb{$2}{$1} = $3;
		}
		else {
			print STDERR "invalid line in $coapps_file:\n$_";
			$flag = 1;
		}
	}
	close IN;
	die if $flag;


	open IN, "$objn_file" or die "unable to open $objn_file: $!\n";
	$flag = 0;
	while (<IN>){
		if (/^\s*$comment/ or /^\s*\n/){
		}
		elsif (/^(\S+)\s(\d+)\n/){
			$objectnumber{$1} = $2;
		}
		elsif (/^(\d+)\n/){
			$O = $1;
		}
		else {
			print STDERR "invalid line in $objn_file:\n$_";
			$flag = 1;
		}
	}
	close IN;
	die if $flag;

        $flag = 0;
        for $label (keys %ll_nb){
                  $flag = 1 unless exists $objectnumber{$label};
        }
        die "some tags in $coapps_file do not appear in $objn_file!\n" if $flag;

        $flag = 0;
        for $label (keys %objectnumber){
                  $flag = 1 unless exists $ll_nb{$label};
        }
        die "some tags in $objn_file do not appear in $coapps_file!\n" if $flag;

}
else {
	open IN, $annots_file or die "unable to open $annots_file: $!\n";
	$flag = 0;
	while (<IN>){
		if (/^\s*$comment/ or /^\s*\n/){
		}
		elsif (/^\S+\s+(\S.*)\n/){
			@temp = split /\s/, $1;
			chomp @temp;
			undef %temp;
			for $label (@temp){
				$temp{$label} = undef;
			}
			@temp = keys %temp;
			if (@temp >= 2){
				$O += 1;
				for $label (@temp){
					$objectnumber{$label} += 1;
					for ($i = 0; $i < @temp; $i++){
						$ll_nb{$label}{$temp[$i]} += 1 unless $temp[$i] eq $label;
					}
				}
			}
		}
		else {
			print STDERR "invalid line in $annots_file:\n$_";
			$flag = 1;
		}
	}
	close IN;
	die if $flag;
}

$_ = keys %ll_nb;
print STDERR "$_ tags found\n";


for $label (keys %ll_nb){
	for $label2 (keys %{$ll_nb{$label}}){
		$mu = $objectnumber{$label} * $objectnumber{$label2} / $O;
		$sigma = sqrt ($mu * ($O - $objectnumber{$label2}) / $O * ($O - $objectnumber{$label}) / ($O - 1));
		$zscore{$label}{$label2} = ($ll_nb{$label}{$label2} - $mu) / $sigma if exists $ll_nb{$label}{$label2};
	}
}


	# centrality calculation

for $label (keys %ll_nb){
	for $label2 (keys %{$ll_nb{$label}}){
		$ll_nb_filtered{$label}{$label2} = $ll_nb{$label}{$label2} if $zscore{$label}{$label2} >= $threshold or ($ll_nb{$label}{$label2} / $objectnumber{$label2} > 0.5 or $ll_nb{$label}{$label2} / $objectnumber{$label} > 0.5);
	}
	$strength{$label} = 0;
	for $label2 (keys %{$ll_nb{$label}}){
		$strength{$label} += $ll_nb{$label}{$label2} if $zscore{$label}{$label2} >= $threshold or ($ll_nb{$label}{$label2} / $objectnumber{$label2} > 0.5 or $ll_nb{$label}{$label2} / $objectnumber{$label} > 0.5);
	}
	$centrality{$label} = 0 unless exists $ll_nb_filtered{$label};
}


print STDERR "centrality calculation\n";
@_ = keys %ll_nb_filtered;
$sum = 0;
undef %temp;
for $label (@_){
	$temp{$label} = $strength{$label};
	$sum += $strength{$label};
}
for ($i = 0; $i < 100; $i++){
	unless ( (POSIX::floor ($i / 2)) * 2 < $i - 0.0000000000001 ){
		$sum2 = 0;
		for $label (@_){
			$temp2{$label} = 0;
			for $label2 (keys %{$ll_nb_filtered{$label}}){
				$temp2{$label} += $temp{$label2} * $ll_nb_filtered{$label}{$label2} / $sum;
			}
			$sum2 += $temp2{$label};
		}
	}
	else {
		$sum = 0;
		for $label (@_){
			$temp{$label} = 0;
			for $label2 (keys %{$ll_nb_filtered{$label}}){
				$temp{$label} += $temp2{$label2} * $ll_nb_filtered{$label}{$label2}/ $sum2;
			}
			$sum += $temp{$label};
		}
	}
	print STDERR "$i/100 ";
}
$c = 0;
for $label (@_){
	$centrality{$label} = $temp{$label} / $sum;
	$c += ($centrality{$label} - $temp2{$label} / $sum2) ** 2;
}
$c = sqrt $c;
print STDERR "\ndone\n";
print STDERR "residual = $c\n";



	# getting the real ancestors & siblings

if ($use_origDAG){
	for $label (keys %parent){
		undef %nexts;
		%nexts = %{$parent{$label}};
		$i = 0;
		do {
			@currents = keys %nexts;
			undef %nexts;
			$i++;
			for $current (@currents){
				$ancestors{$label}{$current} = $i unless exists $ancestors{$label}{$current};
				if (exists $parent{$current}){
					for $next (keys %{$parent{$current}}){
						$nexts{$next} = undef;
					}
				}
			}
		} while (%nexts);
	}
	for $label (keys %parent){
		for $label2 (keys %{$parent{$label}}){
			for $label3 (keys %{$child{$label2}}){
				$siblings{$label}{$label3} = undef unless $label3 eq $label;
			}
		}
	}
}


	# reconstruction

unless ($fout){
	if ($use_annots){
		$fout = $annots_file;
	}
	else {
		$fout = $coapps_file;
	}
        if ($fout =~ /\./){
                $fout =~ s/\.[^\.]+$/_tag_hierarchy_B.txt/;
        }
        else {
                $fout .= "_tag_hierarchy_B.txt";
        }
}
if (-e $fout){
	$i = 2;
	do {
		if ($fout =~ /B.txt$/){
			$fout =~ s/B\.txt$/B_$i.txt/;
		}
		else {
			$fout =~ s/B_\d+\.txt$/B_$i.txt/;
		}
		$i++;
	} while (-e $fout);
}
($all, $exact, $lineage, $near, $inverted, $differentbranches) = (0, 0, 0, 0, 0, 0);
open OUT, ">".$fout or die "unable to open $fout";
for $label (sort {$centrality{$a} <=> $centrality{$b}} keys %ll_nb){
	undef %descendantsvotes;
	undef %nexts;
	$nexts{$label} = undef;
	do {
		@currents = keys %nexts;
		undef %nexts;
		for $current (@currents){
			for $next (keys %{$child_reconstr{$current}}){
				for $label2 (keys %{$ll_nb{$next}}){
					$descendantsvotes{$label2} += $zscore{$label2}{$current} if exists $ll_nb{$label2}{$current} and exists $ll_nb{$label}{$label2} and $centrality{$label2} > $centrality{$label} and ($zscore{$label}{$label2} >= $threshold or $ll_nb{$label}{$label2} / $objectnumber{$label} > 0.5) and exists $ll_nb{$next}{$label2} and ($zscore{$next}{$label2} >= $threshold or $ll_nb{$next}{$label2} / $objectnumber{$next} > 0.5);
				}
				$nexts{$next} = undef; 
			}
		}
	} while (%nexts);
	
	undef %score;
	for $label2 (keys %{$ll_nb{$label}}){
		if ($centrality{$label2} > $centrality{$label} and ($zscore{$label}{$label2} >= $threshold or $ll_nb{$label}{$label2} / $objectnumber{$label} > 0.5)){
			$descendantsvotes{$label2} += $zscore{$label}{$label2};
			$score{$label2} = $descendantsvotes{$label2};
		}
	}

	$parent = undef;
	if (%score){
		$parent = (sort {$score{$b} <=> $score{$a}} keys %score)[0];
	}
	if ($parent){
		$child_reconstr{$parent}{$label} = undef;
		$all += 1;
		if ($use_origDAG){
			if (exists $parent{$label} and exists $parent{$label}{$parent}){
				$exact += 1;
			}
			elsif (exists $ancestors{$label} and exists $ancestors{$label}{$parent}){
				$lineage += 1;
			}
			elsif (exists $siblings{$label} and exists $siblings{$label}{$parent}){
				$near += 1;
			}
			elsif (exists $child{$label} and exists $child{$label}{$parent}){
				$inverted += 1;
			}
			elsif ( (not exists $ancestors{$label} or not exists $ancestors{$label}{$parent}) and (not exists $ancestors{$parent} or not exists $ancestors{$parent}{$label}) ){
				$differentbranches += 1;
			}
		}
		print OUT "$label $parent\n";
	}
	elsif ($use_origDAG and (not exists $parent{$label} or not (keys %{$parent{$label}}))){
		$exact += 1;
	}
}
close OUT;
if ($use_origDAG){
	$_ = $exact + $lineage + $near + $inverted;
	print STDERR "exact = $exact\nancestor = $lineage\ninverted = $inverted\nsibling = $near\ntotal related = $_\ndiffbranches (incl. siblings) = $differentbranches\n";
}
die "\ntotal number of found edges = $all\n\noutput written to $fout\n\n";


